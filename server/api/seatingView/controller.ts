import { Response, NextFunction } from "express";
import { isEmpty } from "lodash";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Loglevel,
  Actions,
  BookingStatus,
  LogTypes,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { UpdateInvoice } from "../../@types/outletInvoice";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import {
  SeatingViewPayload,
  UpdateStatusPayload,
  MoveTableRequestPayload,
} from "../../@types/seatingView";
import { NewReservationBookingPayload } from "../../@types/booking";
import { getGuid } from "../../context/service";
import {
  OutletDbInterface,
  OutletInvoiceDbInterface,
  OutletSeatingTypeDbInterface,
  OutletTableBookingDbInterface,
  OutletTableDbInterface,
  UserDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import {
  CustomerBookingForSeatingView,
  getAdminUser,
  getMealType,
  getOutletDateTime,
} from "../shared";
import { CustomerBookingPayload } from "../../@types/customerBooking";
import { OutletTableBookingDbModel } from "../../db/models";
let moment = require("moment-timezone");

const moduleName = "SeatingView";

export const getSeatingView = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet: any = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, body, uniqueId);

    const userId = decoded.userDetail.id;
    const outletId = params.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const seatingViewPayload: SeatingViewPayload = body;

    //Check OutletSeatingType
    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );
    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(
        seatingViewPayload.outletSeatingTypeId
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "OutletSeatingType Found",
      uniqueId
    );

    let requestStartDate: any = null;
    let requestEndDate: any = null;

    if (seatingViewPayload.date) {
      let startDayDateTime = moment(seatingViewPayload.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day");

      let endDayDateTime = moment(seatingViewPayload.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day");

      requestStartDate = startDayDateTime;
      requestEndDate = endDayDateTime;
    } else {
      let startDayDateTime = moment().tz(outlet.timezone).startOf("day");
      let endDayDateTime = moment().tz(outlet.timezone).endOf("day");
      requestStartDate = startDayDateTime;
      requestEndDate = endDayDateTime;
    }

    let query: any = {
      mealType: "",
    };
    if (!isEmpty(seatingViewPayload.mealType)) {
      query.mealType = seatingViewPayload.mealType;
    }

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);
    const seatingView = await outletTableDbInterface.getAllTablesForSeatingView(
      outletSeatingType.id,
      outlet.id,
      query
    );

    const filterBooking = seatingView.map((seatingTable) => {
      const table = seatingTable.toJSON();
      if (table.OutletTableBooking && table.OutletTableBooking.length > 0) {
        const findBookedTable = table.OutletTableBooking.filter(
          (bookedTable: OutletTableBookingDbModel) => {
            const bookingStartTime = moment(bookedTable.bookingStartTime)
              .tz(outlet.timezone)
              .startOf("day");
            const bookingEndTime = moment(bookedTable.bookingEndTime)
              .tz(outlet.timezone)
              .endOf("day");
            if (
              requestStartDate.isBetween(
                bookingStartTime,
                bookingEndTime,
                undefined,
                "[]"
              ) ||
              requestEndDate.isBetween(
                bookingStartTime,
                bookingEndTime,
                undefined,
                "[]"
              )
            ) {
              return bookedTable;
            }
            return null;
          }
        );

        delete table.OutletTableBooking;

        table.OutletTableBooking = findBookedTable;
      }
      return table;
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      body,
      filterBooking,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: filterBooking,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
      body,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

export const updateStatus = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet: any = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.UPDATED, body, uniqueId);

    const userId = decoded.userDetail.id;
    const outletId = params.id;
    const updateStatusPayload: UpdateStatusPayload = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    let requestStartDate: any = null;
    let requestEndDate: any = null;

    if (updateStatusPayload.date) {
      let startDayDateTime = moment(updateStatusPayload.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day");

      let endDayDateTime = moment(updateStatusPayload.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day");

      requestStartDate = startDayDateTime;
      requestEndDate = endDayDateTime;
    } else {
      let startDayDateTime = moment().tz(outlet.timezone).startOf("day");
      let endDayDateTime = moment().tz(outlet.timezone).endOf("day");
      requestStartDate = startDayDateTime;
      requestEndDate = endDayDateTime;
    }

    const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
      sequelize
    );
    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);

    const outletTableBooking =
      await outletTableBookingDbInterface.getOutletTableBookingById(
        updateStatusPayload.outletTableBookingId
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "OutletTableBooking Found",
      uniqueId
    );

    let query: any = {};
    const currentdate = new Date();

    if (updateStatusPayload.status === BookingStatus.SEATED) {
      (query.status = BookingStatus.SEATED),
        (query.seatStartTime = currentdate),
        (query.seatEndTime = null);
    }

    if (updateStatusPayload.status === BookingStatus.LEFT) {
      (query.status = BookingStatus.LEFT), (query.seatEndTime = currentdate);
    }

    //Update Status of OutletTableBooking
    await outletTableBookingDbInterface.UpdateStatusById(
      outletTableBooking.id,
      query
    );

    let updateInvoice: UpdateInvoice = {
      status: updateStatusPayload.status,
    };

    updateInvoice.status = updateStatusPayload.status;

    await outletInvoiceDbInterface.updateInvoiceStatus(
      outletTableBooking.outletInvoiceId,
      updateInvoice,
      user.id
    );

    //Get Response
    const outletTableDbInterface = new OutletTableDbInterface(sequelize);
    let outletTable = (
      await outletTableDbInterface.getTableForSeatingView(
        outletTableBooking.outletTableId
      )
    )?.toJSON();

    const findBookedTable = outletTable?.OutletTableBooking?.filter(
      (bookedTable: OutletTableBookingDbModel) => {
        const bookingStartTime = moment(bookedTable.bookingStartTime)
          .tz(outlet.timezone)
          .startOf("day");
        const bookingEndTime = moment(bookedTable.bookingEndTime)
          .tz(outlet.timezone)
          .endOf("day");
        if (
          requestStartDate.isBetween(
            bookingStartTime,
            bookingEndTime,
            undefined,
            "[]"
          ) ||
          requestEndDate.isBetween(
            bookingStartTime,
            bookingEndTime,
            undefined,
            "[]"
          )
        ) {
          return bookedTable;
        }
        return null;
      }
    );

    outletTable.OutletTableBooking = findBookedTable;

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      outletTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Status Updated",
        data: outletTable,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.UPDATED,
      body,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

export const moveTableBooking = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, "Move Table", body, uniqueId);

    const userId = decoded.userDetail.id;
    const outletId = params.id;

    const moveTableRequestPayload: MoveTableRequestPayload = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "Move Table",
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "Move Table",
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    let requestStartDate = null;
    let requestEndDate = null;

    if (moveTableRequestPayload.date) {
      let startDayDateTime = moment(moveTableRequestPayload.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day")
        .format();

      let endDayDateTime = moment(moveTableRequestPayload.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day")
        .format();

      requestStartDate = new Date(startDayDateTime);
      requestEndDate = new Date(endDayDateTime);
    } else {
      let startDayDateTime = moment().tz(outlet.timezone).startOf("day");
      let endDayDateTime = moment().tz(outlet.timezone).endOf("day");
      requestStartDate = new Date(startDayDateTime);
      requestEndDate = new Date(endDayDateTime);
    }

    const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
      sequelize
    );

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);

    //Check OutletTableBooking Table
    const outletTableBooking =
      await outletTableBookingDbInterface.getOutletTableBookingById(
        moveTableRequestPayload.outletTableBookingId
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "Move Table",
      "OutletTableBooking Found",
      uniqueId
    );

    //Check OutletTableBooking Table
    const outletTable = await outletTableDbInterface.getOutletTableById(
      moveTableRequestPayload.toOutleTableId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "Move Table",
      "OutletTable Found",
      uniqueId
    );

    //Check if OutletTable have already booked for this timeSlot
    const checkTable = await outletTableDbInterface.checkTableBooking(
      outletTableBooking.bookingStartTime,
      outletTableBooking.bookingEndTime,
      [moveTableRequestPayload.toOutleTableId]
    );

    if (checkTable.length > 0) {
      throw new ApiError({
        message: Exceptions.INVALID_MOVE,
        statusCode: StatusCode.NOTFOUND,
      });
    }

    //Update OutletTableBooking
    await outletTableBookingDbInterface.UpdateOutletTableId(
      outletTableBooking.id,
      outletTable.id
    );

    //Response Of 2 OutletTable
    const response = await outletTableDbInterface.getMoveTables(
      requestStartDate,
      requestEndDate,
      [outletTableBooking.outletTableId, outletTable.id]
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "Move Table",
      body,
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Reservation move successfull",
        data: response,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "Move Table",
      body,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

export const newReservationBooking = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);
    const userId = decoded.userDetail.id;
    const outletId = params.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }
    const newReservationBookingPayload: NewReservationBookingPayload = body;

    const noOfPerson =
      Number(newReservationBookingPayload.noOfAdult) +
      Number(newReservationBookingPayload.noOfChild);

    const currentOutletTime = moment().tz(outlet.timezone);

    let bookingStartTime = null;

    if (
      newReservationBookingPayload.startTime &&
      newReservationBookingPayload.date
    ) {
      bookingStartTime = getOutletDateTime(
        outlet.timezone,
        newReservationBookingPayload.startTime,
        newReservationBookingPayload.date
      );
    } else {
      bookingStartTime = currentOutletTime;
    }

    const bookingEndTime = moment(bookingStartTime)
      .add(outlet.rebookingTableInterval, "minutes")
      .subtract(1, "minutes");

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

    const outletTableIds = newReservationBookingPayload.outletTables.split(",");
    const ids: number[] = [];

    outletTableIds.map((id) => {
      ids.push(parseInt(id));
    });

    const checkTable = await outletTableDbInterface.checkTableBooking(
      new Date(bookingStartTime),
      new Date(bookingEndTime),
      ids
    );

    if (checkTable.length > 0) {
      throw new ApiError({
        message: Exceptions.BOOKING_TIMESLOTS_FULL,
        statusCode: StatusCode.NOTFOUND,
      });
    }
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      "Table Available",
      uniqueId
    );

    const extactTime = bookingStartTime.format("HH:mm");

    const mealType = await getMealType(
      bookingStartTime,
      extactTime,
      outlet.id,
      sequelize,
      uniqueId
    );

    const outletTables = await outletTableDbInterface.getTablesForBooking(ids);

    const customerBookingPayload: CustomerBookingPayload = {
      outletId: outletId,
      name: newReservationBookingPayload.name,
      lastName: newReservationBookingPayload.lastName,
      email: newReservationBookingPayload.email,
      mobileNo: newReservationBookingPayload.mobileNo,
      noOfPerson: noOfPerson,
      noOfAdult: newReservationBookingPayload.noOfAdult,
      noOfChild: newReservationBookingPayload.noOfChild,
      bookingStartTime: bookingStartTime,
      bookingEndTime: bookingEndTime,
      mealType: mealType ? mealType.name : "",
      bookingType: newReservationBookingPayload.bookingType,
      specialRequest: newReservationBookingPayload.specialRequest,
      reservationNotes: newReservationBookingPayload.reservationNotes,
      image: newReservationBookingPayload.image,
      outletTable: outletTables,
      exactTime: extactTime,
      outlet: outlet,
      user,
    };

    const customerBooking = await CustomerBookingForSeatingView(
      customerBookingPayload,
      sequelize,
      uniqueId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "NewBooking",
      body,
      customerBooking,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Booking done successfull",
        data: customerBooking,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "NewBooking",
      body,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};
