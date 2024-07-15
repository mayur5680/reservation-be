import { Response, NextFunction } from "express";
import { sequelizeValidate } from "../../validation";
import {
  Actions,
  catchErrorResponse,
  LogTypes,
  StatusCode,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { SystemLogDbInterface, OutletDbInterface } from "../../db-interfaces";
import { Op } from "sequelize";
import { FilterSystemLog, SystemLogRequest } from "../../@types/systemLog";
let moment = require("moment-timezone");

export const getLogsByOutletId = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { sequelize, params, body } = req;
    sequelizeValidate(sequelize, res);
    const outletId = params.id;

    const logBody: FilterSystemLog = body;

    const outletDbInterface = new OutletDbInterface(sequelize);
    const outlet = await outletDbInterface.getOutletbyId(outletId);

    let NormalDateStartDateTime: any = null;
    let NormalDateEndDateTime: any = null;

    if (logBody.date) {
      let startDayDateTime = moment(logBody.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day");
      let endDayDateTime = moment(logBody.date, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day");
      NormalDateStartDateTime = new Date(startDayDateTime);
      NormalDateEndDateTime = new Date(endDayDateTime);
    } else {
      let startDayDateTime = moment().tz(outlet.timezone).startOf("day");
      let endDayDateTime = moment().tz(outlet.timezone).endOf("day");
      NormalDateStartDateTime = new Date(startDayDateTime);
      NormalDateEndDateTime = new Date(endDayDateTime);
    }

    let query: any = {
      outletId: outlet.id,
      action: {
        [Op.in]: [
          Actions.CREATED,
          Actions.UPDATED,
          Actions.DELETED,
          Actions.SEND,
          Actions.CALL,
        ],
      },
      [Op.and]: [
        {
          createdAt: {
            [Op.gte]: NormalDateStartDateTime,
          },
        },
        {
          createdAt: {
            [Op.lte]: NormalDateEndDateTime,
          },
        },
      ],
    };

    const systemLogDbInterface = new SystemLogDbInterface(sequelize);
    const getAllLogs = (
      await systemLogDbInterface.getLogsByOutletId(query)
    ).map((systemlog) => {
      if (systemlog.OutletInvoice) {
        return {
          ...systemlog.toJSON(),
          contentChange: systemlog.contentChange
            ? JSON.parse(systemlog.contentChange)
            : null,
          OutletInvoice: {
            ...systemlog.OutletInvoice?.toJSON(),
            dietaryRestriction: systemlog.OutletInvoice?.dietaryRestriction
              ? JSON.parse(systemlog.OutletInvoice?.dietaryRestriction)
              : [],
          },
        };
      } else {
        return {
          ...systemlog.toJSON(),
          contentChange: systemlog.contentChange
            ? JSON.parse(systemlog.contentChange)
            : null,
        };
      }
    });

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getAllLogs,
      })
    );
  } catch (error) {
    return catchErrorResponse(error, res);
  }
};

export const getAllLogs = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { sequelize, params, body } = req;
    sequelizeValidate(sequelize, res);

    const logBody: SystemLogRequest = body;

    let NormalDateStartDateTime: any = null;
    let NormalDateEndDateTime: any = null;

    if (logBody.fromDate && logBody.toDate) {
      let startDayDateTime = moment(logBody.fromDate, "DD-MM-YYYY")
        .tz("Asia/Singapore")
        .startOf("day");
      let endDayDateTime = moment(logBody.toDate, "DD-MM-YYYY")
        .tz("Asia/Singapore")
        .endOf("day");
      NormalDateStartDateTime = new Date(startDayDateTime);
      NormalDateEndDateTime = new Date(endDayDateTime);
    } else {
      let startDayDateTime = moment().tz("Asia/Singapore").startOf("day");
      let endDayDateTime = moment().tz("Asia/Singapore").endOf("day");
      NormalDateStartDateTime = new Date(startDayDateTime);
      NormalDateEndDateTime = new Date(endDayDateTime);
    }

    let query: any = {
      type: {
        [Op.like]: LogTypes.SYSTEM_LOG,
      },
      [Op.and]: [
        {
          createdAt: {
            [Op.gte]: NormalDateStartDateTime,
          },
        },
        {
          createdAt: {
            [Op.lte]: NormalDateEndDateTime,
          },
        },
      ],
    };

    const systemLogDbInterface = new SystemLogDbInterface(sequelize);
    const getAllLogs = (await systemLogDbInterface.getAllLogs(query)).map(
      (systemlog) => {
        return {
          ...systemlog.toJSON(),
          contentChange: systemlog.contentChange
            ? JSON.parse(systemlog.contentChange)
            : null,
          requestData: systemlog.requestData
            ? JSON.parse(systemlog.requestData)
            : null,
          responseData: systemlog.responseData
            ? JSON.parse(systemlog.responseData)
            : null,
        };
      }
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getAllLogs,
      })
    );
  } catch (error) {
    return catchErrorResponse(error, res);
  }
};
