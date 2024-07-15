import { Response, NextFunction } from "express";
import { isEmpty } from "lodash";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Loglevel,
  Actions,
  LogTypes,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import {
  OutletDbInterface,
  OutletInvoiceDbInterface,
  OutletTableBookingDbInterface,
  OutletTableDbInterface,
  UserDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import {
  OutletTableBookingDbModel,
  OutletTimeSlotOverrideDbModel,
} from "../../db/models";
import {
  MoveTableRequestPayload,
  timelineViewPayload,
} from "../../@types/timeline";
import {
  filterAndSortRawDbModel,
  getAdminUser,
  getOutletDateTime,
} from "../shared";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
let moment = require("moment-timezone");

const moduleName = "TimeLine";

export const getTimelineView = async (
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

    const timelineViewPayload: timelineViewPayload = body;

    let requestStartDate: any = null;
    let requestEndDate: any = null;

    if (timelineViewPayload.date) {
      let startDayDateTime = moment(timelineViewPayload.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day");

      let endDayDateTime = moment(timelineViewPayload.date, "DD-MM-YYYY")
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
    if (!isEmpty(timelineViewPayload.mealType)) {
      query.mealType = timelineViewPayload.mealType;
    }

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);
    const timeTableView =
      await outletTableDbInterface.getAllTablesForTimelineView(
        outlet.id,
        query
      );

    let filterBooking = timeTableView.map((seatingTable) => {
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

    for (let i = 0; i < filterBooking.length; i++) {
      for (let j = i + 1; j < filterBooking.length; j++) {
        if (
          filterBooking[j].OutletTableBooking.length >
          filterBooking[i].OutletTableBooking.length
        ) {
          const temp = filterBooking[i];
          filterBooking[i] = filterBooking[j];
          filterBooking[j] = temp;
        }
      }
    }

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

export const getMealTiming = async (
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

    const seatingViewPayload: timelineViewPayload = body;

    let requestStartDate: any = null;
    if (seatingViewPayload.date) {
      let startDayDateTime = moment(seatingViewPayload.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day");

      requestStartDate = startDayDateTime;
    } else {
      let startDayDateTime = moment().tz(outlet.timezone).startOf("day");
      requestStartDate = startDayDateTime;
    }

    const dayofweek = requestStartDate.day();

    outlet = await outletDbInterface.getOutletByIdForCustomer(
      outlet.id,
      dayofweek
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Outlet TimeSlot Found",
      uniqueId
    );

    const timeSlotOverrides: OutletTimeSlotOverrideDbModel[] = [];
    outlet.OutletTimeSlotOverride?.map(
      (timeSlotOverride: OutletTimeSlotOverrideDbModel) => {
        const startTime = moment(timeSlotOverride.effectiveFrom)
          .tz(outlet.timezone)
          .startOf("day");

        const endTime = moment(timeSlotOverride.effectiveTo)
          .tz(outlet.timezone)
          .endOf("day");

        if (requestStartDate.isBetween(startTime, endTime, undefined, "[]"))
          timeSlotOverrides.push(timeSlotOverride);
      }
    );
    outlet.OutletTimeSlotOverride = timeSlotOverrides;

    const getAllTimeSlot = filterAndSortRawDbModel(outlet);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      body,
      getAllTimeSlot,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getAllTimeSlot,
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

export const moveReservation = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, "Move Reservation", body, uniqueId);

    const userId = decoded.userDetail.id;
    const outletId = params.id;

    const moveTableRequestPayload: MoveTableRequestPayload = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "Move Reservation",
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "Move Reservation",
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const bookingStartTime = getOutletDateTime(
      outlet.timezone,
      moveTableRequestPayload.time,
      moveTableRequestPayload.date
    );

    const bookingEndTime = moment(bookingStartTime)
      .add(outlet.rebookingTableInterval, "minutes")
      .subtract(1, "minutes");

    let startDayDateTime = moment(moveTableRequestPayload.date, "DD-MM-YYYY")
      .tz(outlet.timezone)
      .startOf("day")
      .format();

    let endDayDateTime = moment(moveTableRequestPayload.date, "DD-MM-YYYY")
      .tz(outlet.timezone)
      .endOf("day")
      .format();

    let requestStartDate = new Date(startDayDateTime);
    let requestEndDate = new Date(endDayDateTime);

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
      "Move Reservation",
      "OutletTableBooking Found",
      uniqueId
    );

    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    let invoice = await outletInvoiceDbInterface.getInvoiceById(
      outletTableBooking.outletInvoiceId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "Move Reservation",
      "Invoice Found",
      uniqueId
    );

    //Check OutletTableBooking Table
    const outletTable = await outletTableDbInterface.getOutletTableById(
      moveTableRequestPayload.toOutleTableId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "Move Reservation",
      "OutletTable Found",
      uniqueId
    );

    //Check if OutletTable have already booked for this timeSlot
    const checkTable = await outletTableDbInterface.checkTableBooking(
      new Date(bookingStartTime),
      new Date(bookingEndTime),
      [moveTableRequestPayload.toOutleTableId]
    );

    if (checkTable.length > 0) {
      throw new ApiError({
        message: Exceptions.INVALID_MOVE,
        statusCode: StatusCode.NOTFOUND,
      });
    }

    //Update OutletTableBooking
    await outletTableBookingDbInterface.UpdateOutletTableInTimeTable(
      outletTableBooking.id,
      outletTable.id,
      bookingStartTime,
      bookingEndTime,
      user.id
    );

    //update invoice
    invoice.bookingDate = bookingStartTime;
    invoice.bookingStartTime = bookingStartTime;
    invoice.bookingEndTime = bookingEndTime;

    await invoice.save();

    // Response Of 2 OutletTable
    const response = await outletTableDbInterface.getMoveTables(
      requestStartDate,
      requestEndDate,
      [outletTable.id, outletTableBooking.outletTableId]
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "Move Reservation",
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
      "Move Reservation",
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
