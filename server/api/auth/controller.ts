import { Response, NextFunction } from "express";
import { generate as otp } from "otp-generator";
import jwt from "jsonwebtoken";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  VerificationType,
  Loglevel,
  LogTypes,
  EmailActionType,
} from "../../context";
import {
  LoginRequest,
  LoginResponse,
  ForgetPasswordRequest,
  ForgetPasswordResponse,
  VerifyCodeRequest,
  ResetPasswordRequest,
} from "../../@types/auth";
import { jwtkey } from "../../config";
import { sequelizeValidate } from "../../validation";
import { UserDbInterface, VerificationDbInterface } from "../../db-interfaces/";
import { getGuid, sendMail } from "../../context/service";
import { Verification } from "../../db/interface";
import { UserDbModel } from "../../db/models";
import { ApiResponse } from "../../@types/apiSuccess";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { Log } from "../../context/Logs";
import { getAdminUser } from "../shared";

const moduleName = "Authentication";

const generateUserToken = (user: UserDbModel): LoginResponse => {
  const userDetail = user.toJSON();
  delete userDetail.password;
  delete userDetail.OutletUser;

  const expiresIn = 60 * 60 * 24; // expires in 24 hours
  const accessToken = jwt.sign({ userDetail }, jwtkey, {
    expiresIn: expiresIn,
  });

  const loginResponse: LoginResponse = {
    accessToken: accessToken,
    expirIn: expiresIn,
    userDetail,
  };

  return loginResponse;
};

export const login = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.LOGGED_IN, body, uniqueId);

    const loginRequest: LoginRequest = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.getLoggedInUser(loginRequest);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.LOGGED_IN,
      "User Found",
      uniqueId
    );

    const loginResponse = generateUserToken(user);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.LOGGED_IN,
      "Token Generated Successfully",
      uniqueId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.LOGGED_IN,
      body,
      loginResponse,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(loginResponse);
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.LOGGED_IN,
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

export const forgetPassword = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, body } = req;
  sequelizeValidate(sequelize, res);
  let user: UserDbModel | null = await getAdminUser(sequelize);
  let outlet = null;

  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.LOGGED_IN, body, uniqueId);

    const forgetPasswordRequest: ForgetPasswordRequest = body;
    let source;

    const verificationDbInterface = new VerificationDbInterface(sequelize);

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.getUserOutLetsByUserName(
      forgetPasswordRequest.userName
    );
    if (!user) {
      throw new ApiError({
        message: Exceptions.INVALID_USER,
        statusCode: StatusCode.NOTFOUND,
      });
    }

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.LOGGED_IN,
      "User Found",
      uniqueId
    );

    const code = otp(7, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    forgetPasswordRequest.type === VerificationType.EMAIL
      ? (source = user.email)
      : (source = user.phone);

    const createVerificaion: Verification = {
      guid: getGuid(),
      code,
      userId: user.id,
      source,
      type: forgetPasswordRequest.type,
      expiredAt: new Date(new Date().getTime() + 60 * 60 * 1000),
    };

    const Verificaion = await verificationDbInterface.create(createVerificaion);

    //Send Email
    let html = `# Verification code Please use the verification code below to sign in. <strong style="font-size: 130%">${Verificaion.code}</strong> If you didn’t request this, you can ignore this email. Thanks, The CreatE Reservation team`;
    await sendMail(
      user.email,
      html,
      sequelize,
      uniqueId,
      EmailActionType.FORGOT_PASSWORD,
      null,
      "CreatE: Forgot Password"
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.LOGGED_IN,
      "Mail Send Successfully",
      uniqueId
    );

    const forgetPasswordResponse: ForgetPasswordResponse = {
      verificationToken: createVerificaion.guid,
      source: createVerificaion.source,
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.LOGGED_IN,
      body,
      forgetPasswordResponse,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(forgetPasswordResponse);
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.LOGGED_IN,
      body,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user as UserDbModel,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

export const verifiyCode = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.LOGGED_IN, body, uniqueId);

    const verifyCodeRequest: VerifyCodeRequest = body;

    const verificationDbInterface = new VerificationDbInterface(sequelize);
    const verification = await verificationDbInterface.findByIdAndCode(
      verifyCodeRequest
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.LOGGED_IN,
      "OTO Successfully Verified",
      uniqueId
    );

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(verification.userId);

    const loginResponse = generateUserToken(user);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.LOGGED_IN,
      "Token is Generated Successfully",
      uniqueId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.LOGGED_IN,
      body,
      loginResponse,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(loginResponse);
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.LOGGED_IN,
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

export const resetPassword = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { sequelize, body, decoded } = req;

    sequelizeValidate(sequelize, res);
    const user: UserDbModel = decoded.userDetail;

    const resetPasswordRequest: ResetPasswordRequest = body;

    const userDbInterface = new UserDbInterface(sequelize);
    const userDetail = await userDbInterface.resetPassword(
      user.id,
      resetPasswordRequest
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Password Change Successfully",
      })
    );
  } catch (error) {
    return catchErrorResponse(error, res);
  }
};
