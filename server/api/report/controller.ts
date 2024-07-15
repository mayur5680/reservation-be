import { Response, NextFunction } from "express";
import { flattenDeep, groupBy } from "lodash";
import { Op } from "sequelize";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Loglevel,
  LogTypes,
  BookingStatus,
  CustomerReportFilter,
  BookingType,
  ReservationReport,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import {
  CompanyDbInterface,
  CustomerDbInterface,
  OutletDbInterface,
  OutletInvoiceDbInterface,
  UserDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { getAdminUser } from "../shared";
import { OutletDbModel } from "../../db/models";
import {
  CustomerReportPayload,
  CustomerReportOutletResonse,
  CustomerTotalDines,
  MealTypes,
  OutletResponse,
  ReservationReportPayload,
  ReservationReportResponse,
  CustomerReportResonse,
  GroupEventReportPayload,
  OutletsEvent,
  EventTypes,
  GroupEventReportResponse,
  SingleEventReportPayload,
  SingleEventReportResponse,
} from "../../@types/report";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";

let moment = require("moment-timezone");

const moduleName = "Report Module";

export const getReservationReport = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getReservationReport",
      body,
      uniqueId
    );

    const userId = decoded.userDetail.id;

    const reservationReportPayload: ReservationReportPayload = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getReservationReport",
      "User Found",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);

    const companies = await companyDbInterface.getAllcompanyByIdsWithOutlet(
      reservationReportPayload.companyIds
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getReservationReport",
      "Comapnies Found",
      uniqueId
    );

    let outletIds: number[] = [];

    let outlets: OutletDbModel[] = [];

    companies.map((companys) => {
      if (companys.Outlet && companys.Outlet?.length > 0) {
        companys.Outlet.map((outlet) => {
          outletIds.push(outlet.id);
          outlets.push(outlet);
        });
      }
    });

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);

    const outletResponse: OutletResponse[] = [];

    let getAllInvoice: any[] = [];

    //Count by MealType in Outlet
    await Promise.all(
      outlets.map(async (outlet) => {
        const outletData: OutletResponse = {
          name: outlet.name,
          mealTypes: [],
        };

        let startDayDateTime = moment(
          reservationReportPayload.fromDate,
          "DD-MM-YYYY"
        )
          .tz(outlet.timezone)
          .startOf("day");

        let endDayDateTime = moment(
          reservationReportPayload.toDate,
          "DD-MM-YYYY"
        )
          .tz(outlet.timezone)
          .endOf("day");

        let currentOutletTime = moment().tz(outlet.timezone);

        if (reservationReportPayload.filter === ReservationReport.UPCOMING) {
          if (
            startDayDateTime.isSame(currentOutletTime, "day") ||
            startDayDateTime.isBefore(currentOutletTime)
          ) {
            startDayDateTime = currentOutletTime;
          }
        } else {
          if (
            endDayDateTime.isSame(currentOutletTime, "day") ||
            endDayDateTime.isAfter(currentOutletTime)
          ) {
            endDayDateTime = currentOutletTime;
          }
        }

        const check = endDayDateTime.isBefore(startDayDateTime);
        if (check) {
          throw new ApiError({
            message: Exceptions.INVALID_DATE_TIME,
            statusCode: StatusCode.BAD_REQUEST,
          });
        }

        let NormalDateStartDateTime = new Date(startDayDateTime);
        let NormalDateEndDateTime = new Date(endDayDateTime);

        let query: any = {
          outletId: outlet.id,
          bookingType: {
            [Op.in]: reservationReportPayload.bookingType,
          },
          status: {
            [Op.in]: reservationReportPayload.status,
          },
          mealType: {
            [Op.in]: reservationReportPayload.mealType,
          },
          [Op.or]: [
            {
              [Op.or]: [
                {
                  bookingStartTime: {
                    [Op.between]: [
                      NormalDateStartDateTime,
                      NormalDateEndDateTime,
                    ],
                  },
                },
                {
                  bookingEndTime: {
                    [Op.between]: [
                      NormalDateStartDateTime,
                      NormalDateEndDateTime,
                    ],
                  },
                },
              ],
            },
            {
              [Op.and]: [
                {
                  bookingStartTime: {
                    [Op.lt]: NormalDateStartDateTime,
                  },
                },
                {
                  bookingEndTime: {
                    [Op.gt]: NormalDateEndDateTime,
                  },
                },
              ],
            },
          ],
        };

        //find all invoice
        let getInvoiceByOutlet = (
          await outletInvoiceDbInterface.getAllInvoiceForReports(query)
        ).map((invoice) => {
          return {
            ...invoice.toJSON(),
            basket: invoice.basket ? JSON.parse(invoice.basket) : [],
          };
        });

        getAllInvoice.push(getInvoiceByOutlet);

        reservationReportPayload.mealType.map((mealType) => {
          const filterInvoiceByMealType = getInvoiceByOutlet.filter(
            (invoice) =>
              invoice.mealType == mealType && invoice.outletId === outlet.id
          );

          let totalNumberOfReservation = 0;
          let totalNumberOfPerson = 0;

          filterInvoiceByMealType.map((invoice) => {
            totalNumberOfPerson += invoice.noOfPerson;
            totalNumberOfReservation++;
          });

          outletData.mealTypes.push({
            mealType,
            totalNumberOfPerson,
            totalNumberOfReservation,
          });
        });

        //Preorder MealType
        reservationReportPayload.mealType.map((mealType) => {
          const filterInvoiceByPreOrder = getInvoiceByOutlet.filter(
            (invoice) =>
              invoice.basket.length > 0 &&
              invoice.outletId === outlet.id &&
              invoice.mealType == mealType
          );

          let totalNumberOfReservation = 0;
          let totalNumberOfPreoderItem = 0;

          filterInvoiceByPreOrder.map((invoice) => {
            totalNumberOfPreoderItem += invoice.basket.length;
            totalNumberOfReservation++;
          });

          outletData.mealTypes.push({
            mealType: `Pre Order (${mealType})`,
            totalNumberOfReservation,
            totalNumberOfPreoderItem,
          });
        });

        outletResponse.push(outletData);
      })
    );

    getAllInvoice = flattenDeep(getAllInvoice);

    const total: MealTypes[] = [];

    let noShowCount = 0;
    let grandTotalTableBook = 0;

    //Total Count
    reservationReportPayload.mealType.map((mealType) => {
      const filterInvoiceByMealType = getAllInvoice.filter(
        (invoice) => invoice.mealType == mealType
      );

      let totalNumberOfReservation = 0;
      let totalNumberOfPerson = 0;

      filterInvoiceByMealType.map((invoice) => {
        totalNumberOfReservation++;
        totalNumberOfPerson += invoice.noOfPerson;
        grandTotalTableBook += invoice.OutletTableBooking?.length as number;

        if (invoice.status == BookingStatus.NOSHOW) {
          noShowCount += invoice.OutletTableBooking?.length as number;
        }
      });

      total.push({
        mealType,
        totalNumberOfPerson,
        totalNumberOfReservation,
      });
    });

    reservationReportPayload.mealType.map((mealType) => {
      const filterInvoiceByMealType = getAllInvoice.filter(
        (invoice) => invoice.basket.length > 0 && invoice.mealType == mealType
      );

      let totalNumberOfReservation = 0;
      let totalNumberOfPreoderItem = 0;

      filterInvoiceByMealType.map((invoice) => {
        totalNumberOfReservation++;
        totalNumberOfPreoderItem += invoice.basket.length;
      });

      total.push({
        mealType: `Pre Order (${mealType})`,
        totalNumberOfReservation,
        totalNumberOfPreoderItem,
      });
    });

    const noShow = parseFloat(
      ((noShowCount / grandTotalTableBook) * 100).toFixed(2)
    );

    const reservationReportResponse: ReservationReportResponse = {
      Outlet: outletResponse,
      Total: total,
      noShow,
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "getReservationReport",
      body,
      reservationReportResponse,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: reservationReportResponse,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "getReservationReport",
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

export const getCustomerReport = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getCustomerReport",
      body,
      uniqueId
    );

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getCustomerReport",
      "User Found",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);

    const customerReportPayload: CustomerReportPayload = body;

    const companies = await companyDbInterface.getAllcompanyByIdsWithOutlet(
      customerReportPayload.companyIds
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getCustomerReport",
      "Comapnies Found",
      uniqueId
    );

    let NormalDateStartDateTime: any = null;
    let NormalDateEndDateTime: any = null;

    if (companies.length > 0) {
      if (companies[0].Outlet && companies[0].Outlet.length > 0) {
        let startDayDateTime = moment(
          customerReportPayload.fromDate,
          "DD-MM-YYYY"
        )
          .tz(companies[0].Outlet[0].timezone)
          .startOf("day");

        let endDayDateTime = moment(customerReportPayload.toDate, "DD-MM-YYYY")
          .tz(companies[0].Outlet[0].timezone)
          .endOf("day");
        NormalDateStartDateTime = new Date(startDayDateTime);
        NormalDateEndDateTime = new Date(endDayDateTime);
      }
    }

    let query: any = {
      [Op.or]: [
        {
          [Op.or]: [
            {
              bookingStartTime: {
                [Op.between]: [NormalDateStartDateTime, NormalDateEndDateTime],
              },
            },
            {
              bookingEndTime: {
                [Op.between]: [NormalDateStartDateTime, NormalDateEndDateTime],
              },
            },
          ],
        },
        {
          [Op.and]: [
            {
              bookingStartTime: {
                [Op.lt]: NormalDateStartDateTime,
              },
            },
            {
              bookingEndTime: {
                [Op.gt]: NormalDateEndDateTime,
              },
            },
          ],
        },
      ],
    };

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);

    let response: CustomerReportResonse | number = 0;

    if (customerReportPayload.filter === CustomerReportFilter.FREQUENT) {
      let outletIds: number[] = [];

      let outlets: OutletDbModel[] = [];

      companies.map((companys) => {
        if (companys.Outlet && companys.Outlet?.length > 0) {
          companys.Outlet.map((outlet) => {
            outletIds.push(outlet.id);
            outlets.push(outlet);
          });
        }
      });

      query.outletId = {
        [Op.in]: outletIds,
      };

      let getInvoice =
        await outletInvoiceDbInterface.getAllInvoiceForCustomerReport(query);

      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        "getCustomerReport",
        getInvoice,
        uniqueId
      );

      const customerReportOutletResonse: CustomerReportOutletResonse[] = [];

      outlets.map((outlet) => {
        const outletInvoice = getInvoice.filter(
          (invoice) => invoice.outletID === outlet.id
        );

        const data = groupBy(outletInvoice, "totalBookingCount");

        const customerTotalDines: CustomerTotalDines[] = [];

        Object.keys(data).map((field) => {
          if (Number(field) >= 4) {
            customerTotalDines.push({
              index: ">4",
              totalDines: data[field].length,
            });
          } else {
            customerTotalDines.push({
              index: field,
              totalDines: data[field].length,
            });
          }
        });

        customerReportOutletResonse.push({
          name: outlet.name,
          customerTotalDines: customerTotalDines,
        });
      });

      const total: CustomerTotalDines[] = [];
      const data = groupBy(getInvoice, "totalBookingCount");

      Object.keys(data).map((field) => {
        if (Number(field) >= 4) {
          total.push({
            index: ">4",
            totalDines: data[field].length,
          });
        } else {
          total.push({
            index: field,
            totalDines: data[field].length,
          });
        }
      });

      const customerReportResonse: CustomerReportResonse = {
        Outlet: customerReportOutletResonse,
        Total: total,
      };

      response = customerReportResonse;
    }
    if (customerReportPayload.filter === CustomerReportFilter.CROSS) {
      if (
        (customerReportPayload.outletIds &&
          customerReportPayload.outletIds?.length <= 1) ||
        !customerReportPayload.outletIds
      ) {
        throw new ApiError({
          message: Exceptions.CUSTOM_ERROR,
          devMessage: "Invalid Outlet Ids",
          statusCode: StatusCode.BAD_REQUEST,
        });
      }

      query.outletId = {
        [Op.in]: customerReportPayload.outletIds,
      };

      let getInvoice = await outletInvoiceDbInterface.getAllInvoiceForReports(
        query
      );

      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        "getCustomerReport",
        getInvoice,
        uniqueId
      );

      const customerIds = getInvoice.map((invoice) => invoice.customerId);

      const customerDbInterface = new CustomerDbInterface(sequelize);

      const customers = await customerDbInterface.getCustomerForReport(
        customerIds
      );

      response = customers.length;
    }

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "getCustomerReport",
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
        data: response,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "getCustomerReport",
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

export const getGroupEventReport = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getGroupEventReport",
      body,
      uniqueId
    );

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getGroupEventReport",
      "User Found",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);

    const eventReportPayload: GroupEventReportPayload = body;

    const companies = await companyDbInterface.getAllcompanyByIdsWithOutlet(
      eventReportPayload.companyIds
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getGroupEventReport",
      "Comapnies Found",
      uniqueId
    );

    let outletIds: number[] = [];

    let outlets: OutletDbModel[] = [];

    companies.map((companys) => {
      if (companys.Outlet && companys.Outlet?.length > 0) {
        companys.Outlet.map((outlet) => {
          outletIds.push(outlet.id);
          outlets.push(outlet);
        });
      }
    });

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);

    const outletResponse: OutletsEvent[] = [];

    let getAllInvoice: any[] = [];

    await Promise.all(
      outlets.map(async (outlet) => {
        const outletData: OutletsEvent = {
          name: outlet.name,
          mealTypes: [],
        };

        let startDayDateTime = moment(eventReportPayload.fromDate, "DD-MM-YYYY")
          .tz(outlet.timezone)
          .startOf("day");

        let endDayDateTime = moment(eventReportPayload.toDate, "DD-MM-YYYY")
          .tz(outlet.timezone)
          .endOf("day");

        let NormalDateStartDateTime = new Date(startDayDateTime);
        let NormalDateEndDateTime = new Date(endDayDateTime);

        let query: any = {
          outletId: outlet.id,
          bookingType: BookingType.PRIVATE_EVENT,
          mealType: {
            [Op.in]: eventReportPayload.mealType,
          },
          [Op.or]: [
            {
              [Op.or]: [
                {
                  bookingStartTime: {
                    [Op.between]: [
                      NormalDateStartDateTime,
                      NormalDateEndDateTime,
                    ],
                  },
                },
                {
                  bookingEndTime: {
                    [Op.between]: [
                      NormalDateStartDateTime,
                      NormalDateEndDateTime,
                    ],
                  },
                },
              ],
            },
            {
              [Op.and]: [
                {
                  bookingStartTime: {
                    [Op.lt]: NormalDateStartDateTime,
                  },
                },
                {
                  bookingEndTime: {
                    [Op.gt]: NormalDateEndDateTime,
                  },
                },
              ],
            },
          ],
        };

        let getInvoiceByOutlet =
          await outletInvoiceDbInterface.getAllInvoiceForReports(query);

        Log.writeLog(
          Loglevel.INFO,
          moduleName,
          "getGroupEventReport",
          getInvoiceByOutlet,
          uniqueId
        );

        getAllInvoice.push(getInvoiceByOutlet);

        eventReportPayload.mealType.map((mealType) => {
          const filterInvoiceByMealType = getInvoiceByOutlet.filter(
            (invoice) =>
              invoice.mealType == mealType && invoice.outletId === outlet.id
          );

          let totalNumberOfReservation = 0;
          let totalNumberOfPerson = 0;
          let totalAmount = 0;

          filterInvoiceByMealType.map((invoice) => {
            totalNumberOfReservation++;
            totalNumberOfPerson += invoice.noOfPerson;
            totalAmount += invoice.totalAmount;
          });

          outletData.mealTypes.push({
            mealType,
            totalNumberOfPerson,
            totalNumberOfReservation,
            totalAmount,
          });
        });
        outletResponse.push(outletData);
      })
    );

    getAllInvoice = flattenDeep(getAllInvoice);

    const total: EventTypes[] = [];

    eventReportPayload.mealType.map((mealType) => {
      const filterInvoiceByMealType = getAllInvoice.filter(
        (invoice) => invoice.mealType == mealType
      );

      let totalNumberOfReservation = 0;
      let totalNumberOfPerson = 0;
      let totalAmount = 0;

      filterInvoiceByMealType.map((invoice) => {
        totalNumberOfReservation++;
        totalNumberOfPerson += invoice.noOfPerson;
        totalAmount += invoice.totalAmount;
      });

      total.push({
        mealType,
        totalNumberOfPerson,
        totalNumberOfReservation,
        totalAmount,
      });
    });

    const groupEventReportResponse: GroupEventReportResponse = {
      Outlet: outletResponse,
      Total: total,
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "getGroupEventReport",
      body,
      groupEventReportResponse,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: groupEventReportResponse,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "getGroupEventReport",
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

export const getSingleEventReport = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getSingleEventReport",
      body,
      uniqueId
    );

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getSingleEventReport",
      "User Found",
      uniqueId
    );

    const eventReportPayload: SingleEventReportPayload = body;

    const outletDbInterface = new OutletDbInterface(sequelize);
    const outlet = await outletDbInterface.getOutletbyId(
      eventReportPayload.outletId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getSingleEventReport",
      "Outlet Found",
      uniqueId
    );

    let NormalDateStartDateTime: any = null;
    let NormalDateEndDateTime: any = null;

    let startDayDateTime = moment(eventReportPayload.fromDate, "DD-MM-YYYY")
      .tz(outlet.timezone)
      .startOf("day");

    let endDayDateTime = moment(eventReportPayload.toDate, "DD-MM-YYYY")
      .tz(outlet.timezone)
      .endOf("day");

    NormalDateStartDateTime = new Date(startDayDateTime);
    NormalDateEndDateTime = new Date(endDayDateTime);

    let query: any = {
      bookingType: BookingType.PRIVATE_EVENT,
      mealType: {
        [Op.in]: eventReportPayload.mealType,
      },
      outletId: outlet.id,
      [Op.or]: [
        {
          [Op.or]: [
            {
              bookingStartTime: {
                [Op.between]: [NormalDateStartDateTime, NormalDateEndDateTime],
              },
            },
            {
              bookingEndTime: {
                [Op.between]: [NormalDateStartDateTime, NormalDateEndDateTime],
              },
            },
          ],
        },
        {
          [Op.and]: [
            {
              bookingStartTime: {
                [Op.lt]: NormalDateStartDateTime,
              },
            },
            {
              bookingEndTime: {
                [Op.gt]: NormalDateEndDateTime,
              },
            },
          ],
        },
      ],
    };

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);

    let getInvoice = await outletInvoiceDbInterface.getAllInvoiceForReports(
      query
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getSingleEventReport",
      getInvoice,
      uniqueId
    );

    const dateResponse: OutletsEvent[] = [];

    while (startDayDateTime.isBefore(endDayDateTime)) {
      let date = startDayDateTime.format("DD-MM-YYYY");

      let starTime = moment(date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day");

      let endTime = moment(date, "DD-MM-YYYY").tz(outlet.timezone).endOf("day");

      const filterInvoiceByDate = getInvoice.filter((invoice) => {
        const bookingStartTime = moment(invoice.bookingStartTime).tz(
          outlet.timezone
        );

        if (bookingStartTime.isBetween(starTime, endTime, undefined, "[]")) {
          return invoice;
        }
        return null;
      });

      const dateData: OutletsEvent = {
        name: date,
        mealTypes: [],
      };

      eventReportPayload.mealType.map((mealType) => {
        const filterInvoiceByMealType = filterInvoiceByDate.filter(
          (invoice) => invoice.mealType == mealType
        );

        let totalNumberOfReservation = 0;
        let totalNumberOfPerson = 0;
        let totalAmount = 0;

        filterInvoiceByMealType.map((invoice) => {
          totalNumberOfReservation++;
          totalNumberOfPerson += invoice.noOfPerson;
          totalAmount += invoice.totalAmount;
        });

        dateData.mealTypes.push({
          mealType,
          totalNumberOfPerson,
          totalNumberOfReservation,
          totalAmount,
        });
      });
      dateResponse.push(dateData);

      startDayDateTime = moment(startDayDateTime)
        .tz(outlet.timezone)
        .add(1, "days");
    }

    const total: EventTypes[] = [];

    eventReportPayload.mealType.map((mealType) => {
      const filterInvoiceByMealType = getInvoice.filter(
        (invoice) => invoice.mealType == mealType
      );

      let totalNumberOfReservation = 0;
      let totalNumberOfPerson = 0;
      let totalAmount = 0;

      filterInvoiceByMealType.map((invoice) => {
        totalNumberOfReservation++;
        totalNumberOfPerson += invoice.noOfPerson;
        totalAmount += invoice.totalAmount;
      });

      total.push({
        mealType,
        totalNumberOfPerson,
        totalNumberOfReservation,
        totalAmount,
      });
    });

    const singleEventReportResponse: SingleEventReportResponse = {
      Date: dateResponse,
      Total: total,
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "getSingleEventReport",
      body,
      singleEventReportResponse,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: singleEventReportResponse,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "getSingleEventReport",
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
