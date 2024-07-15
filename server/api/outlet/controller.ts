import { Response, NextFunction } from "express";
import multer from "multer";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  LogTypes,
  Loglevel,
} from "../../context";
import { sequelizeValidate } from "../../validation";

import { OutletDbModel, OutletUserDbModel, UserDbModel } from "../../db/models";
import {
  UserDbInterface,
  OutletDbInterface,
  CompanyDbInterface,
} from "../../db-interfaces/";
import { Outlet } from "../../db/interface";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { ApiResponse } from "../../@types/apiSuccess";
import { UserOutletResponse } from "../../@types/outlet";
import { getGuid } from "../../context/service";
import { Log } from "../../context/Logs";
import { imageLocation } from "../../config";
import {
  getAdminUser,
  getUpdateBy,
  payloadValidation,
  creatDefaultRecords,
  nameValidation,
  contentChanges,
} from "../shared";
import { CreateOutletPayloadd, UpdateOutletPayloadd } from "../../validation";

const moduleName = "OutletManagement";

//File Upload
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageLocation.outletFilePath);
  },
  filename: (req, file, cb) => {
    const getExtension = file.originalname.toString().split(".")[1];
    cb(null, getGuid() + "." + getExtension); //Appending .jpg
  },
});

export const upload = multer({
  storage: fileStorageEngine,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
  limits: { fileSize: 2000000 },
}).single("image");

export const getUserOutlets = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();

  try {
    const { sequelize, decoded } = req;
    sequelizeValidate(sequelize, res);

    const userId = decoded.userDetail.id;
    const userDbInterface = new UserDbInterface(sequelize);

    const user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    let userOutlets: OutletDbModel[] | UserDbModel;

    //Check if user is Super Admin or not
    if (user.roleId) {
      userOutlets = await outletDbInterface.getAllOutlets();
    } else {
      userOutlets = await userDbInterface.getUserOutLetsById(user.id);
    }

    let userOutletResponse: UserOutletResponse[] = [];

    if (userOutlets instanceof UserDbModel) {
      userOutlets.OutletUser &&
        userOutlets.OutletUser.map((singleOutlet: OutletUserDbModel) => {
          userOutletResponse.push({
            outlet: singleOutlet.Outlet as OutletDbModel,
            role: singleOutlet.Role,
          });
        });
    } else {
      userOutlets.map((singleOutlet: OutletDbModel) => {
        userOutletResponse.push({
          outlet: singleOutlet,
        });
      });
    }

    return res.status(StatusCode.SUCCESS).send(userOutletResponse);
  } catch (error) {
    return catchErrorResponse(error, res);
  }
};

//Create New Outlet by super Admin
export const createOutlet = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, body, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

    const userId = decoded.userDetail.id;
    const userDbInterface = new UserDbInterface(sequelize);

    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "User Found",
      uniqueId
    );

    const outlet: Outlet = body;

    const companyDbInterface = new CompanyDbInterface(sequelize);

    if (outlet.companyId) {
      await companyDbInterface.getComapnyById(outlet.companyId, false);
      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        Actions.CREATED,
        "Company Found",
        uniqueId
      );
    } else {
      delete outlet.companyId;
    }

    payloadValidation(CreateOutletPayloadd, outlet);
    const outletDbInterface = new OutletDbInterface(sequelize);

    //Check Outlet Check with Name
    await nameValidation(outletDbInterface.repository, {
      name: outlet.name,
    });

    //check ivrs number
    const checkIvrs = await outletDbInterface.getOutletIvrsPhoneNoByCompanyId(
      outlet.ivrsPhoneNo as string,
      outlet.companyId as number
    );

    if (checkIvrs) {
      throw new ApiError({
        message: Exceptions.DUPLICATE_IVRS_PHONENO,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.outletFilePath, "images/")
        .replace(/\s/g, "");

      outlet.image = image;
    }

    const createOutlet = (
      await outletDbInterface.createOutlet(outlet, userId)
    ).toJSON();

    const outletResponse = await outletDbInterface.getOutletbyId(
      createOutlet.id
    );

    //create Default Records in Outlet
    await creatDefaultRecords(createOutlet.id, user.id, uniqueId, sequelize);

    const response = {
      ...outletResponse.toJSON(),
      updatedBy: getUpdateBy(user),
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      createOutlet,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      response
    );
    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "New Outlet Created Successfully",
        data: { outlet: response },
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.CREATED,
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

//Get Oultet By Id
export const getOutlet = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { sequelize, decoded, params } = req;

    sequelizeValidate(sequelize, res);

    const userId = decoded.userDetail.id;
    const userDbInterface = new UserDbInterface(sequelize);

    const user = await userDbInterface.checkUserById(userId);

    const outletId = params.id;
    const outletDbInterface = new OutletDbInterface(sequelize);
    const outlet = await outletDbInterface.getOutletbyId(outletId);

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: outlet,
      })
    );
  } catch (error) {
    return catchErrorResponse(error, res);
  }
};

//Delete Outlet By Id
export const deleteOutlet = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.DELETED, params, uniqueId);

    const userId = decoded.userDetail.id;
    const userDbInterface = new UserDbInterface(sequelize);

    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "User Found",
      uniqueId
    );

    const outletId = params.id;

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outletId);
    }

    const outletDbInterface = new OutletDbInterface(sequelize);
    const deletedOutlet = await outletDbInterface.deleteOutlet(
      outletId,
      userId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      params,
      deletedOutlet,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      deletedOutlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Outlet Deleted Successfully",
        data: deletedOutlet.id,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.DELETED,
      params,
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

//Update Outlet By Id
export const updateOutlet = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, body, decoded, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.UPDATED, body, uniqueId);

    const outletBody: Outlet = body;
    const outletId = params.id;
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

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId, false);
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

    if (outlet.ivrsPhoneNo !== outletBody.ivrsPhoneNo) {
      //check ivrs number
      const checkIvrs = await outletDbInterface.getOutletIvrsPhoneNoByCompanyId(
        outletBody.ivrsPhoneNo as string,
        outletBody.companyId as number
      );

      if (checkIvrs) {
        throw new ApiError({
          message: Exceptions.DUPLICATE_IVRS_PHONENO,
          statusCode: StatusCode.BAD_REQUEST,
        });
      }
    }

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.outletFilePath, "images/")
        .replace(/\s/g, "");

      outletBody.image = image;
    }

    payloadValidation(UpdateOutletPayloadd, outletBody);

    if (outlet.name !== outletBody.name) {
      //Check OutletTable Check with Name
      await nameValidation(outletDbInterface.repository, {
        name: outletBody.name,
      });
    }

    const companyDbInterface = new CompanyDbInterface(sequelize);
    if (outletBody.companyId) {
      await companyDbInterface.getComapnyById(outletBody.companyId, false);
      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        Actions.CREATED,
        "Company Found",
        uniqueId
      );
    } else {
      delete outletBody.companyId;
    }

    const updatedOutlet = await outletDbInterface.updateOutlet(
      outletBody,
      outletId,
      userId
    );

    const contentChange = contentChanges(
      outlet.toJSON(),
      updatedOutlet.toJSON()
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updatedOutlet,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Outlet Updated Successfully",
        data: updatedOutlet,
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
