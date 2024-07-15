import { Response, NextFunction } from "express";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Loglevel,
  Actions,
  LogTypes,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { getGuid } from "../../context/service";
import {
  FutureTradingHours,
  TimeSlotRequest,
} from "../../@types/customerBooking";
import { Log } from "../../context/Logs";
import {
  checkTableAvailbility,
  getAdminUser,
  getTradingHours,
} from "../shared";
import {
  OutletDbInterface,
  OutletTableDbInterface,
  ShortenLinkDbInterface,
} from "../../db-interfaces";
let moment = require("moment-timezone");

const moduleName = "Common Api";

export const getTimeSlotForCustomer = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, body, uniqueId);

    const timeSlotRequestPayload: TimeSlotRequest = body;

    const noOfPerson =
      Number(timeSlotRequestPayload.noOfAdult) +
      Number(timeSlotRequestPayload.noOfChild);

    if (noOfPerson <= 0) {
      throw new ApiError({
        message: Exceptions.INVALID_PAX,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const outletDbInterface = new OutletDbInterface(sequelize);
    const checkOutlet = await outletDbInterface.getOutletbyId(
      timeSlotRequestPayload.outletId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    const requestDate = moment(timeSlotRequestPayload.date, "DD-MM-YYYY")
      .tz(checkOutlet.timezone)
      .startOf("day");

    const dayofweek = requestDate.day();
    const weekname = requestDate.format("dddd");

    const currentOutletStartDate = moment()
      .tz(checkOutlet.timezone)
      .startOf("day");

    //Check Requestdate
    const checkdate = requestDate.isBefore(currentOutletStartDate);
    if (checkdate) {
      throw new ApiError({
        message: Exceptions.INVALID_DATE_TIME,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Date is valid",
      uniqueId
    );

    outlet = await outletDbInterface.getOutletByIdForCustomer(
      checkOutlet.id,
      dayofweek
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Outlet TimeSlot Found",
      uniqueId
    );

    if (timeSlotRequestPayload.checkPax === false) {
      //check Table Availibility
      const isValidTableRequest = await checkTableAvailbility(
        noOfPerson,
        timeSlotRequestPayload.outletId,
        sequelize
      );

      if (!isValidTableRequest) {
        throw new ApiError({
          message: Exceptions.INVALID_TABLE_CAPACITY,
          statusCode: StatusCode.NOTFOUND,
        });
      }
      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        Actions.GET,
        "Request is valid",
        uniqueId
      );
    } else {
      const outletTableDbInterface = new OutletTableDbInterface(sequelize);

      const checktables =
        await outletTableDbInterface.getAllOutletTableByOutletId(outlet.id);

      if (checktables.length === 0) {
        throw new ApiError({
          message: Exceptions.INVALID_OUTLET_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
      }
    }

    const timeSlotResponse: FutureTradingHours[] = await getTradingHours(
      outlet,
      timeSlotRequestPayload,
      weekname,
      sequelize,
      uniqueId
    );
    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      body,
      timeSlotResponse,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: timeSlotResponse,
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

export const getShortenUrl = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  try {
    Log.writeLog(Loglevel.INFO, moduleName, "getShortenUrl", params, uniqueId);

    const { id } = params;

    const shortenLinkDbInterface = new ShortenLinkDbInterface(sequelize);

    const getShortenUrl = await shortenLinkDbInterface.getShortenLinkByCode(id);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "getShortenUrl",
      params,
      getShortenUrl,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      null
    );

    if (getShortenUrl) {
      return res.status(StatusCode.SUCCESS).send({ url: getShortenUrl.source });
    }
    return res.status(StatusCode.NOTFOUND).send({
      message: "Invalid URL",
      devMessage: "Invalid URL",
      statusCode: 404,
    });
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      "getShortenUrl",
      params,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      null
    );
    return catchErrorResponse(error, res);
  }
};
