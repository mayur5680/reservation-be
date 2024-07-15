import { Sequelize } from "sequelize";
import { ApiError } from "../../@types/apiError";
import { TableChangeRequest, UpdateInvoice } from "../../@types/outletInvoice";
import { OutletTableBookingPayload } from "../../@types/outletTableBooking";
import {
  Loglevel,
  StatusCode,
  BookingType,
  Actions,
  LogTypes,
  BookingStatus,
} from "../../context";
import { Log } from "../../context/Logs";
import {
  OutletTableDbInterface,
  OutletInvoiceDbInterface,
  OutletTableBookingDbInterface,
  OutletDbInterface,
  SystemLogDbInterface,
  CustomerLogsDbInterface,
} from "../../db-interfaces";
import { OutletInvoiceDbModel, OutletDbModel } from "../../db/models";
import { Exceptions } from "../../exception";
import {
  CustomerBookingForChope,
  getAdminUser,
  getMealType,
  getOutletDateTime,
} from "./";
import { ChopeBookingPayload, ReadEmailData } from "../../@types/chope";
import { isEmpty } from "lodash";
let moment = require("moment-timezone");

export const updateInvoiceDateAndTable = async (
  tableChangeRequest: TableChangeRequest,
  invoice: OutletInvoiceDbModel,
  outlet: OutletDbModel,
  sequelize: Sequelize,
  uniqueId: string
): Promise<OutletInvoiceDbModel> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      "updateInvoiceDateAndTable",
      "tableChangeRequest",
      tableChangeRequest,
      uniqueId
    );

    const currentOutletTime = moment().tz(outlet.timezone);

    let bookingStartTime = getOutletDateTime(
      outlet.timezone,
      tableChangeRequest.startTime,
      tableChangeRequest.date
    );

    let bookingEndTime: any;

    if (invoice.bookingType === BookingType.PRIVATE_EVENT) {
      if (!tableChangeRequest.endDate || !tableChangeRequest.endTime) {
        throw new ApiError({
          message: Exceptions.CUSTOM_ERROR,
          devMessage: "End Date or End Time is required",
          statusCode: StatusCode.BAD_REQUEST,
        });
      }

      if (tableChangeRequest.endDate && tableChangeRequest.endTime) {
        bookingEndTime = getOutletDateTime(
          outlet.timezone,
          tableChangeRequest.endTime,
          tableChangeRequest.endDate
        );
      }
    } else {
      bookingEndTime = moment(bookingStartTime)
        .add(outlet.rebookingTableInterval, "minutes")
        .subtract(1, "minutes");
    }

    //check requested date is past date or not
    const checkdate = bookingStartTime.isBefore(currentOutletTime);
    if (checkdate) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    //check bookingStartTime is smaller than bookingEndTime
    const check = bookingEndTime.isBefore(bookingStartTime);
    if (check) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);
    const checkTable = await outletTableDbInterface.checkTableBooking(
      new Date(bookingStartTime),
      new Date(bookingEndTime),
      tableChangeRequest.outletTables
    );

    if (checkTable.length > 0) {
      throw new ApiError({
        message: Exceptions.BOOKING_TIMESLOTS_FULL,
        statusCode: StatusCode.NOTFOUND,
      });
    }
    Log.writeLog(
      Loglevel.INFO,
      "Invoive",
      "updateInvoiceDateAndTable",
      "Table Available",
      uniqueId
    );

    const mealType = await getMealType(
      bookingStartTime,
      tableChangeRequest.startTime,
      outlet.id,
      sequelize,
      uniqueId
    );

    const outletTables = await outletTableDbInterface.getTablesForBooking(
      tableChangeRequest.outletTables
    );

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
      sequelize
    );

    await sequelize.transaction(async (transaction) => {
      //delete old booking table
      await outletTableBookingDbInterface.deleteOutletTableBooking(
        invoice.id,
        transaction
      );

      //Create TableBooking
      const outletTableBookingPayload: OutletTableBookingPayload = {
        outletInvoice: invoice,
        outletTable: outletTables,
      };

      const tableBooking = await outletTableBookingDbInterface.create(
        outletTableBookingPayload,
        outlet.id,
        bookingStartTime,
        bookingEndTime,
        BookingStatus.BOOKED,
        transaction
      );

      //update invoice
      const invoiceUpdatePayload: UpdateInvoice = {
        noOfPerson:
          Number(tableChangeRequest.noOfAdult) +
          Number(tableChangeRequest.noOfChild),
        noOfAdult: tableChangeRequest.noOfAdult,
        noOfChild: tableChangeRequest.noOfChild,
        bookingDate: bookingStartTime,
        bookingStartTime: bookingStartTime,
        bookingEndTime: bookingEndTime,
        mealType: mealType ? mealType.name : "",
        status: invoice.status,
      };

      invoice = await outletInvoiceDbInterface.updateInvoiceWithTransction(
        invoice.id,
        invoiceUpdatePayload,
        transaction
      );
    });

    Log.writeLog(
      Loglevel.INFO,
      "updateInvoiceDateAndTable",
      "Updated-Invoice",
      invoice,
      uniqueId
    );

    return invoice;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "getAllInvoiceByDate",
      "error",
      error,
      uniqueId
    );
    throw error;
  }
};

export const bookingFromEmail = async (
  allReadyEmailData: ReadEmailData[],
  sequelize: Sequelize,
  uniqueId: string
) => {
  try {
    let user = await getAdminUser(sequelize);
    await Promise.all(
      allReadyEmailData.map(async (readEmailData) => {
        if (!isEmpty(readEmailData)) {
          try {
            Log.writeLog(
              Loglevel.INFO,
              "bookingFromEmail",
              "readVendorData",
              readEmailData,
              uniqueId
            );
            //find invoice with chope Id
            const outletInvoiceDbInterface = new OutletInvoiceDbInterface(
              sequelize
            );

            const outletDbInterface = new OutletDbInterface(sequelize);
            const outlet = await outletDbInterface.getOutletbyChopeName(
              readEmailData.outlet
            );

            Log.writeLog(
              Loglevel.INFO,
              "bookingFromEmail",
              Actions.GET,
              "Outlet Found",
              uniqueId
            );

            const requestDate = moment(
              `${readEmailData.date}`,
              "dddd,MMMM DD, YYYY"
            )
              .tz(outlet.timezone)
              .startOf("day");

            const extactTime = moment(`${readEmailData.time}`, [
              "h:mm A",
            ]).format("HH:mm");

            const starTime = extactTime.split(":");
            if (starTime.length !== 2) {
              throw new ApiError({
                message: Exceptions.INVALID_DATE_TIME,
                statusCode: StatusCode.BAD_REQUEST,
              });
            }

            const bookingStartTime = moment(requestDate).set({
              hour: starTime[0],
              minute: starTime[1],
            });

            const bookingEndTime = moment(bookingStartTime)
              .add(outlet.rebookingTableInterval, "minutes")
              .subtract(1, "minutes");

            const noOfPerson = readEmailData.noOfPerson;

            if (!readEmailData.bookingID) {
              Log.writeLog(
                Loglevel.ERROR,
                "bookingFromEmail",
                "findEmailInvoice",
                readEmailData,
                uniqueId
              );
            } else {
              const findEmailInvoice =
                await outletInvoiceDbInterface.getInvoiceByEmailBookingIdAndTime(
                  readEmailData.bookingID
                );

              Log.writeLog(
                Loglevel.INFO,
                "bookingFromEmail",
                "findEmailInvoice",
                findEmailInvoice,
                uniqueId
              );

              switch (readEmailData.status) {
                case "New Reservation":
                  try {
                    await newReservationFromVendor(
                      findEmailInvoice,
                      outlet,
                      readEmailData,
                      bookingStartTime,
                      bookingEndTime,
                      extactTime,
                      noOfPerson,
                      sequelize,
                      uniqueId
                    );
                    break;
                  } catch (error) {
                    throw error;
                  }

                case "Cancelled Reservation":
                  try {
                    await CancelEmailReservation(
                      findEmailInvoice,
                      sequelize,
                      uniqueId
                    );
                    break;
                  } catch (error) {
                    throw error;
                  }

                case "Edited Reservation":
                  try {
                    await UpdateEmailReservation(
                      findEmailInvoice,
                      outlet,
                      readEmailData,
                      bookingStartTime,
                      bookingEndTime,
                      extactTime,
                      noOfPerson,
                      sequelize,
                      uniqueId
                    );
                    break;
                  } catch (error) {
                    throw error;
                  }
              }
            }
          } catch (error) {
            Log.writeExitLog(
              Loglevel.ERROR,
              "bookingFromEmail",
              "readEmailData",
              readEmailData,
              error,
              uniqueId,
              sequelize,
              LogTypes.SYSTEM_LOG,
              user,
              null,
              null,
              false
            );
          }
        }
      })
    );
  } catch (error) {
    Log.writeLog(Loglevel.ERROR, "bookingFromEmail", "error", error, uniqueId);
  }
};

const newReservationFromVendor = async (
  findEmailInvoice: OutletInvoiceDbModel | null,
  outlet: OutletDbModel,
  readEmailData: ReadEmailData,
  bookingStartTime: any,
  bookingEndTime: any,
  extactTime: any,
  noOfPerson: string,
  sequelize: Sequelize,
  uniqueId: string
): Promise<void> => {
  try {
    if (!findEmailInvoice) {
      await BookedReservation(
        outlet,
        readEmailData,
        bookingStartTime,
        bookingEndTime,
        extactTime,
        noOfPerson,
        sequelize,
        uniqueId
      );
    } else {
      Log.writeLog(
        Loglevel.INFO,
        "newReservationFromVendor",
        "Booking Already Created ",
        findEmailInvoice,
        uniqueId
      );
    }
  } catch (error) {
    throw error;
  }
};

const BookedReservation = async (
  outlet: OutletDbModel,
  readEmailData: ReadEmailData,
  bookingStartTime: any,
  bookingEndTime: any,
  extactTime: any,
  noOfPerson: string,
  sequelize: Sequelize,
  uniqueId: string
): Promise<void> => {
  try {
    const mealType = await getMealType(
      bookingStartTime,
      extactTime,
      outlet.id,
      sequelize,
      uniqueId
    );

    const names = readEmailData.name.split(" ");

    const mobileNo = readEmailData.mobileNo.split(" ").join("");

    const customerBookingPayload: ChopeBookingPayload = {
      outletId: outlet.id,
      name: names.length === 3 ? names[1] : names[0],
      lastName: names.length === 3 ? names[2] : names[1],
      email: readEmailData.email,
      mobileNo,
      noOfPerson: Number(noOfPerson),
      bookingStartTime: bookingStartTime,
      bookingEndTime: bookingEndTime,
      mealType: mealType ? mealType.name : "",
      bookingType: BookingType.NORMAL_RESERVATION,
      specialRequest: readEmailData.specialRequest,
      exactTime: extactTime,
      outlet: outlet,
      chopeBookingId: readEmailData.bookingID,
      source: readEmailData.source,
    };

    await CustomerBookingForChope(customerBookingPayload, sequelize, uniqueId);
  } catch (error) {
    Log.writeLog(Loglevel.ERROR, "BookedReservation", "error", error, uniqueId);
    throw error;
  }
};

const CancelEmailReservation = async (
  findEmailInvoice: OutletInvoiceDbModel | null,
  sequelize: Sequelize,
  uniqueId: string
): Promise<void> => {
  if (findEmailInvoice) {
    if (findEmailInvoice.status !== BookingStatus.CANCELLED) {
      findEmailInvoice.status = BookingStatus.CANCELLED;
      await findEmailInvoice.save();

      const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
        sequelize
      );

      let query = {
        status: BookingStatus.CANCELLED,
      };

      //Update OutletTable Booking Status
      await outletTableBookingDbInterface.UpdateStatusByInvoiceId(
        findEmailInvoice.id,
        query
      );

      Log.writeLog(
        Loglevel.INFO,
        "CancelEmailReservation",
        "Invoice Status Change",
        findEmailInvoice,
        uniqueId
      );
    } else {
      Log.writeLog(
        Loglevel.INFO,
        "CancelEmailReservation",
        "Reservation Already Cancelled",
        findEmailInvoice,
        uniqueId
      );
    }
  } else {
    Log.writeLog(
      Loglevel.INFO,
      "CancelEmailReservation",
      "Invoice NotFound",
      findEmailInvoice,
      uniqueId
    );
  }
};

const UpdateEmailReservation = async (
  findEmailInvoice: OutletInvoiceDbModel | null,
  outlet: OutletDbModel,
  readChopeData: ReadEmailData,
  bookingStartTime: any,
  bookingEndTime: any,
  extactTime: any,
  noOfPerson: string,
  sequelize: Sequelize,
  uniqueId: string
): Promise<void> => {
  try {
    if (findEmailInvoice && findEmailInvoice.Customer) {
      const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
        sequelize
      );
      const systemLogDbInterface = new SystemLogDbInterface(sequelize);
      const customerLogsDbInterface = new CustomerLogsDbInterface(sequelize);

      const names = readChopeData.name.split(" ");

      const customer = findEmailInvoice.Customer;

      if (
        customer.email !== readChopeData.email ||
        customer.mobileNo !== readChopeData.mobileNo ||
        customer.name !== names[1] ||
        customer.lastName !== names[2]
      ) {
        customer.email = readChopeData.email;
        customer.mobileNo = readChopeData.mobileNo;
        customer.name = names[0] ? names[0] : customer.name;
        customer.lastName = names[2] ? names[0] : customer.lastName;

        await customer.save();
      }

      if (
        findEmailInvoice.bookingStartTime.getTime() !==
          new Date(bookingStartTime).getTime() ||
        findEmailInvoice.noOfPerson != Number(noOfPerson)
      ) {
        //delete old booking table
        await outletTableBookingDbInterface.deleteOutletTableBookingByInvoiceId(
          findEmailInvoice.id
        );

        //delete System log
        await systemLogDbInterface.deleteByInvoiceId(findEmailInvoice.id);

        //delete CustomerLog
        await customerLogsDbInterface.deleteByInvoiceId(findEmailInvoice.id);

        await findEmailInvoice.destroy({ force: true });

        await BookedReservation(
          outlet,
          readChopeData,
          bookingStartTime,
          bookingEndTime,
          extactTime,
          noOfPerson,
          sequelize,
          uniqueId
        );
      }
    } else {
      Log.writeLog(
        Loglevel.INFO,
        "UpdateEmailReservation",
        "Invoice NotFound",
        findEmailInvoice,
        uniqueId
      );
    }
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "UpdateEmailReservation",
      "error",
      error,
      uniqueId
    );
    throw error;
  }
};
