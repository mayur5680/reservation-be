import { Sequelize } from "sequelize";
import { v1 } from "uuid";
import { SystemLogDbInterface } from "../db-interfaces/systemlogDbInterface";
import { SystemLog } from "../db/interface";
import { mailchimp } from "../config/index";
import nodemailer from "nodemailer";
import { LogTypes, Actions, Loglevel, LogStatus, StatusCode } from ".";
import { SystemLogPayload } from "../@types/systemLog";
import { Log } from "./Logs";
import { CompanyDbModel, OutletDbModel } from "../db/models";
import { cloneDeep } from "lodash";
import { getAdminUser } from "../api/shared";
import { ApiError } from "../@types/apiError";
import { Exceptions } from "../exception";
const moduleName = "Email";

export const getGuid = () => {
  return v1();
};

export const writeLog = async (systemLogPayload: SystemLogPayload) => {
  if (systemLogPayload.action === Actions.GET) return null;
  if (
    systemLogPayload.action === Actions.CREATED ||
    systemLogPayload.action === Actions.UPDATED ||
    systemLogPayload.action === Actions.DELETED ||
    systemLogPayload.action === Actions.SEND ||
    systemLogPayload.action === Actions.CALL
  ) {
    const log: SystemLog = {
      type: systemLogPayload.type,
      action: systemLogPayload.action,
      module: systemLogPayload.module,
      identifier: systemLogPayload.user.userName,
      name: systemLogPayload.user.firstName
        ? systemLogPayload.user.firstName
        : systemLogPayload.user.userName,
      guid: getGuid(),
      outletId: systemLogPayload.outlet ? systemLogPayload.outlet.id : null,
      updatedBy: systemLogPayload.user.id,
      status: systemLogPayload.status,
      callerId: getGuid(),
      contentChange: systemLogPayload.contentChange,
      requestData: systemLogPayload.requestData,
      responseData: systemLogPayload.responseData,
    };

    let systemLogDbInterface = new SystemLogDbInterface(
      systemLogPayload.sequelize
    );
    return await systemLogDbInterface.create(log);
  }
  return null;
};

export const sendMail = async (
  emailId: string,
  Html: string,
  sequelize: Sequelize,
  uniqueId: string,
  action: string,
  outlet?: OutletDbModel | null,
  subject = "CreatE-Reservation",
  invoiceId: string | null = null,
  name: string | null = null,
  userName: string | null = null,
  password: string | null = null,
  cc: string[] | null = null
) => {
  let user = await getAdminUser(sequelize);

  try {
    const mailChimpDetails = cloneDeep(mailchimp);

    if (userName) {
      mailChimpDetails.auth.user = userName;
    }
    if (password) {
      mailChimpDetails.auth.pass = password;
    }

    Log.writeLog(Loglevel.INFO, action, emailId, mailChimpDetails, uniqueId);

    let client = nodemailer.createTransport(mailChimpDetails);

    let info = await client.sendMail({
      from: mailChimpDetails.auth.user,
      to: emailId,
      subject: subject,
      html: Html,
      cc: cc ? cc : [],
    });

    Log.writeLog(Loglevel.INFO, action, emailId, info, uniqueId);

    if (invoiceId && outlet) {
      const log: SystemLog = {
        type: LogTypes.TRANSACTIONAL_EMAIL,
        action,
        module: " ",
        identifier: emailId,
        name: name ? name : emailId,
        guid: getGuid(),
        outletId: outlet.id,
        updatedBy: user.id,
        status: LogStatus.SUCCESS,
        outletInvoiceId: invoiceId,
        callerId: getGuid(),
      };

      let systemLogDbInterface = new SystemLogDbInterface(sequelize);

      await systemLogDbInterface.create(log);
    }
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      action,
      emailId,
      error,
      uniqueId,
      sequelize,
      LogTypes.TRANSACTIONAL_EMAIL,
      user,
      outlet
    );
  }
};

export const sendSMS = async (
  mobileNo: string,
  body: string,
  company: CompanyDbModel,
  sequelize: Sequelize,
  uniqueId: string
) => {
  let user = await getAdminUser(sequelize);
  let outlet: any = null;
  try {
    Log.writeLog(Loglevel.INFO, "sendSMS", "mobileNo", mobileNo, uniqueId);

    if (
      !company.twilioAccountSid ||
      !company.twilioAuthToken ||
      !company.twilioMessagingServiceSid
    ) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "api secret key is not are set!!!",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const client = require("twilio")(
      company.twilioAccountSid,
      company.twilioAuthToken
    );

    const smsPayload = {
      shortenUrls: true,
      body: body,
      messagingServiceSid: company.twilioMessagingServiceSid,
      to: mobileNo,
    };

    Log.writeLog(Loglevel.INFO, "sendSMS", "smsPayload", smsPayload, uniqueId);

    const response = await client.messages.create(smsPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      "sendSMS",
      "SMS Sending",
      mobileNo,
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return response;
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "sendSMS",
      "SMS Sending",
      mobileNo,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
  }
};
