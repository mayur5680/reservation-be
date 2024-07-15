import { Response, NextFunction } from "express";
import { Sequelize } from "sequelize";
import { isEmpty } from "lodash";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  Loglevel,
  LogTypes,
  SMSTemplateTypes,
  IvrsCustomerDial,
  LogStatus,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid, sendSMS } from "../../context/service";
import {
  UserDbInterface,
  IvrsDetailDbInterface,
  IvrsCallLogsDbInterface,
  OutletDbInterface,
  CompanyDbInterface,
  SMSTemplateDbInterface,
  CustomerDbInterface,
  SystemLogDbInterface,
} from "../../db-interfaces";
import { CompanyDbModel, OutletDbModel } from "../../db/models";
import { Log } from "../../context/Logs";
import { IvrsPayload, UpdateIvrsDetails } from "../../@types/ivrsDetails";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import {
  contentChanges,
  getAdminUser,
  linkVoiceCallToIvrs,
  replaceHtml,
  saveIvrsVoiceCall,
} from "../shared";
import { IvrsDetails, SystemLog } from "../../db/interface";

let moment = require("moment-timezone");

const moduleName = "IVRS";

export const createIvrsDetials = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, body, uniqueId);

    const outletId = params.outletId;
    const userId = decoded.userDetail.id;

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

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const company = await companyDbInterface.getComapnyById(outlet.companyId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Company Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const ivrsPayload: IvrsPayload = body;

    const ivrsDetailDbInterface = new IvrsDetailDbInterface(sequelize);

    //save ivrs voice call
    await saveIvrsVoiceCall(sequelize, uniqueId);

    //link ivrs call detials to voiceCalls
    await linkVoiceCallToIvrs(sequelize, uniqueId);

    const getIvrsDetails = (
      await ivrsDetailDbInterface.getIvrsDetails(outlet.id)
    ).map((data) => {
      return {
        ...data.toJSON(),
        pressedDigit: data.pressedDigit ? JSON.parse(data.pressedDigit) : [],
        tags: JSON.parse(data.tags),
      };
    });

    let startDayDateTime = moment(ivrsPayload.fromDate, "DD-MM-YYYY")
      .tz(outlet.timezone)
      .startOf("day");

    let endDayDateTime = moment(ivrsPayload.toDate, "DD-MM-YYYY")
      .tz(outlet.timezone)
      .endOf("day");

    let ivrsDetail = getIvrsDetails.filter((ivrs) => {
      const callstart = moment(ivrs.callstart);
      if (
        callstart.isBetween(startDayDateTime, endDayDateTime, undefined, "[]")
      ) {
        return ivrs;
      }
      return null;
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      body,
      ivrsDetail,
      uniqueId,
      sequelize,
      LogTypes.IVRS,
      user,
      null
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: ivrsDetail,
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
      LogTypes.IVRS,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

export const updateIvrsDetails = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.UPDATED, body, uniqueId);

    const { ivrsId } = params;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "User Found",
      uniqueId
    );

    const ivrsDetailDbInterface = new IvrsDetailDbInterface(sequelize);
    const ivrsRecord = await ivrsDetailDbInterface.getIvrsDetailById(ivrsId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Record Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(ivrsRecord.outletId);
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

    const updateIvrsDetails: UpdateIvrsDetails = body;

    if (ivrsRecord.isDone !== updateIvrsDetails.isDone) {
      const ivrsCallLogsDbInterface = new IvrsCallLogsDbInterface(sequelize);

      let log: string;
      if (updateIvrsDetails.isDone === true) {
        log = `${user.email} has marked as Done`;
      } else {
        log = `${user.email} has marked as Undone`;
      }

      await ivrsCallLogsDbInterface.create(ivrsRecord.id, log, user.id);
    }

    updateIvrsDetails.tags = JSON.stringify(updateIvrsDetails.tags);

    const updatedIvrsRecord = await ivrsDetailDbInterface.updateIvrsDetails(
      ivrsRecord.id,
      updateIvrsDetails
    );

    const contentChange = contentChanges(
      ivrsRecord.toJSON(),
      updatedIvrsRecord.toJSON()
    );

    const response = {
      ...updatedIvrsRecord.toJSON(),
      pressedDigit: updatedIvrsRecord.pressedDigit
        ? JSON.parse(updatedIvrsRecord.pressedDigit)
        : [],
      tags: JSON.parse(updatedIvrsRecord.tags),
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      response,
      uniqueId,
      sequelize,
      LogTypes.IVRS,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Record Updated Successfully",
        data: response,
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
      LogTypes.IVRS,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

export const getCallerInfo = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;

  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, body, uniqueId);

    const { ivrsId } = params;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "User Found",
      uniqueId
    );

    const ivrsDetailDbInterface = new IvrsDetailDbInterface(sequelize);
    const ivrsRecord = await ivrsDetailDbInterface.getIvrsDetailById(ivrsId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Record Found",
      uniqueId
    );

    const ivrsCallLogsDbInterface = new IvrsCallLogsDbInterface(sequelize);
    const ivrsLogs = await ivrsCallLogsDbInterface.getAllLogsByIvrsId(
      ivrsRecord.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      body,
      ivrsLogs,
      uniqueId,
      sequelize,
      LogTypes.IVRS,
      user,
      null
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: ivrsLogs,
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
      LogTypes.IVRS,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

export const DIDWWCallBack = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, body } = req;
  try {
    Log.writeLog(
      Loglevel.INFO,
      "DIDWW-Webhook",
      "Call Started",
      body,
      uniqueId
    );
    const ivrsDetailDbInterface = new IvrsDetailDbInterface(sequelize);
    const customerDbInterface = new CustomerDbInterface(sequelize);
    const outletDbInterface = new OutletDbInterface(sequelize);
    if (!isEmpty(body)) {
      //find Outlet
      const outlet = await outletDbInterface.getOutletIvrsPhoneNo(
        "+" + body.attributes.did_number
      );

      Log.writeLog(Loglevel.INFO, "DIDWW-Webhook", "outlet", outlet, uniqueId);

      if (outlet) {
        //find caller
        if (body.type != "incoming-call-start-event") {
          const findCaller =
            await ivrsDetailDbInterface.getIvrsDetailByCallerId(
              body.attributes.call_id
            );
          Log.writeLog(
            Loglevel.INFO,
            "DIDWW-Webhook",
            "findCaller",
            findCaller,
            uniqueId
          );

          if (body.type == "incoming-call-connect-event" && !findCaller) {
            //find customer
            const customer = await customerDbInterface.getCustomerPhoneNo(
              "+" + body.attributes.src_number
            );
            Log.writeLog(
              Loglevel.INFO,
              "DIDWW-Webhook",
              "customer",
              customer,
              uniqueId
            );

            const ivrsDetails: IvrsDetails = {
              callerId: body.attributes.call_id,
              from: "+" + body.attributes.src_number,
              to: "+" + body.attributes.did_number,
              callstart: moment.tz(
                body.attributes.time_start,
                "YYYY-MM-DDTHH:mm:ss",
                "UTC"
              ),
              outletId: outlet.id,
              customerId: customer ? customer.id : null,
            };

            const createCaller = await ivrsDetailDbInterface.create(
              ivrsDetails
            );
            Log.writeLog(
              Loglevel.INFO,
              "DIDWW-Webhook",
              "createCaller",
              createCaller,
              uniqueId
            );
          }

          if (
            body.type == "incoming-call-end-event" &&
            findCaller &&
            findCaller.is_completed == false
          ) {
            findCaller.callend = moment.tz(
              body.attributes.time_end,
              "YYYY-MM-DDTHH:mm:ss",
              "UTC"
            );
            findCaller.duration = body.attributes.duration;
            findCaller.is_completed = true;
            await findCaller.save();

            const systemLogsPayload: SystemLog = {
              guid: getGuid(),
              type: LogTypes.IVRS,
              name: findCaller.Customer ? findCaller.Customer.name : " ",
              identifier: findCaller.from,
              action: LogStatus.SUCCESS,
              module: LogTypes.IVRS,
              outletId: outlet ? outlet.id : null,
              duration: findCaller.duration,
              callerId: findCaller.callerId,
              status: LogStatus.SUCCESS,
            };

            let systemLogDbInterface = new SystemLogDbInterface(sequelize);

            await systemLogDbInterface.create(systemLogsPayload);
          }
        }
      }
    } else {
      Log.writeLog(
        Loglevel.ERROR,
        "DIDWW-Webhook",
        "error",
        "outlet not found",
        uniqueId
      );
      return res.status(404).send("this phone number is not register yet");
    }

    return res.status(StatusCode.SUCCESS).send("");
  } catch (error) {
    Log.writeLog(Loglevel.ERROR, "DIDWW-Webhook", "error", error, uniqueId);
    return res.status(404).send("");
  }
};

export const PBXCallBack = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params } = req;
  try {
    Log.writeLog(Loglevel.INFO, "PBX-Webhook", "started", params, uniqueId);

    const { To, From, Digit } = params;

    const ivrsDetailDbInterface = new IvrsDetailDbInterface(sequelize);
    const outletDbInterface = new OutletDbInterface(sequelize);

    const outlet = await outletDbInterface.getOutletIvrsPhoneNo(To);
    Log.writeLog(Loglevel.INFO, "PBX-Webhook", "outlet", outlet, uniqueId);

    if (!isEmpty(outlet)) {
      // If the user entered digits, process their request
      if (Digit) {
        const pressedDigit = (IvrsCustomerDial as any)[Number(Digit)];
        const findCaller = await ivrsDetailDbInterface.getUnfinishCall(From);
        Log.writeLog(
          Loglevel.INFO,
          "PBX-Webhook",
          "findCaller",
          findCaller,
          uniqueId
        );

        if (findCaller) {
          const customerPressDigit = findCaller.pressedDigit
            ? JSON.parse(findCaller.pressedDigit)
            : [];

          if (pressedDigit) {
            customerPressDigit.push(pressedDigit);
            findCaller.pressedDigit = JSON.stringify(customerPressDigit);
            await findCaller.save();
          }
        }

        switch (Digit) {
          case "1":
            await sendSMSInTwilio(
              outlet as OutletDbModel,
              From,
              sequelize,
              uniqueId
            );
            break;
          // case "2":

          //   break;

          // case "3":

          //   break;

          // case "4":

          //   break;
        }
      }

      return res.status(200).send("");
    } else {
      Log.writeLog(Loglevel.ERROR, "PBX-Webhook", "error", params, uniqueId);
      return res.status(404).send("this phone number is not register yet");
    }
  } catch (error) {
    Log.writeLog(Loglevel.ERROR, "PBX-Webhook", "error", error, uniqueId);
    return res.status(404).send("");
  }
};

export const sendSMSInTwilio = async (
  outlet: OutletDbModel,
  phoneNo: string,
  sequelize: Sequelize,
  uniqueId: string
) => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "sendSMSInTwilio",
      phoneNo,
      uniqueId
    );

    const smsTemplateDbInterface = new SMSTemplateDbInterface(sequelize);

    const template = await smsTemplateDbInterface.getSMSTemplateByOulet(
      outlet.id,
      SMSTemplateTypes.RESERVATION
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "sendSMSInTwilio",
      template,
      uniqueId
    );

    if (template) {
      const body = await replaceHtml(
        outlet,
        null,
        template.body,
        sequelize,
        false
      );

      const response = await sendSMS(
        phoneNo,
        body,
        outlet.Company as CompanyDbModel,
        sequelize,
        uniqueId
      );
    }
  } catch (error) {
    throw error;
  }
};
