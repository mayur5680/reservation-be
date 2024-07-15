import { Response, NextFunction } from "express";
import multer from "multer";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  LogTypes,
  Loglevel,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import { DiningOption } from "../../db/interface";
import { DiningOptionFilter } from "../../@types/diningOption";
import {
  DiningOptionDbInterface,
  UserDbInterface,
  OutletDbInterface,
} from "../../db-interfaces";
import { imageLocation } from "../../config";
import { Log } from "../../context/Logs";
import {
  CreateDiningOptionPayload,
  UpdateDiningOptionPayload,
} from "../../validation";
import {
  contentChanges,
  getAdminUser,
  getUpdateBy,
  nameValidation,
  payloadValidation,
} from "../shared";
import { uniqBy } from "lodash";
import { GetAllSectionsRequest } from "../../@types/section";
import { ContentChangesPayload } from "../../@types/customer";

const moduleName = "DiningOption";

//File Upload
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageLocation.diningoptionFilePath);
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

//Create DiningOption
export const createDiningOption = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, params, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

    const outletId = params.outletId;
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

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const diningOptionPayload: DiningOption = body;

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.diningoptionFilePath, "images/")
        .replace(/\s/g, "");

      diningOptionPayload.image = image;
    }

    diningOptionPayload.outletId = outlet.id;

    payloadValidation(CreateDiningOptionPayload, diningOptionPayload);

    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

    const diningOptionDbInterface = new DiningOptionDbInterface(sequelize);

    //Check Item Name
    await nameValidation(diningOptionDbInterface.repository, {
      name: diningOptionPayload.name,
      outletId: diningOptionPayload.outletId,
    });

    const diningOption = await diningOptionDbInterface.create(
      diningOptionPayload,
      userId
    );

    const response = {
      ...diningOption.toJSON(),
      repeatOn: diningOption.repeatOn ? JSON.parse(diningOption.repeatOn) : [],
      updatedBy: getUpdateBy(user),
    };

    let contentChangesPayload: ContentChangesPayload = {
      name: response.name ? response.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Dining Option Created Successfully",
        data: response,
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

//Get All DiningOption
export const getAllDiningOption = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      { params, body },
      uniqueId
    );

    const outletId = params.outletId;

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    const diningOptionPayload: DiningOptionFilter = body;

    let query: any = {
      outletId: outlet.id,
    };

    if (diningOptionPayload.isActive) {
      query.isActive = true;
    }

    const diningOptionDbInterface = new DiningOptionDbInterface(sequelize);
    const diningOptions = (
      await diningOptionDbInterface.getAllDiningOption(query)
    ).map((diningOption) => {
      return {
        ...diningOption.toJSON(),
        repeatOn: diningOption.repeatOn
          ? JSON.parse(diningOption.repeatOn)
          : [],
      };
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      diningOptions,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: diningOptions,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
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

//Update DiningOption By Id
export const updateDiningOption = async (
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
    const { diningOptionId, outletId } = params;

    const userId = decoded.userDetail.id;

    const diningOptionPayload: DiningOption = body;

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

    const diningOptionDbInterface = new DiningOptionDbInterface(sequelize);
    const diningOption = await diningOptionDbInterface.getDiningOptionById(
      diningOptionId,
      false
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "DiningOption Found",
      uniqueId
    );

    if (diningOption.name !== diningOptionPayload.name) {
      //Check Item Name
      await nameValidation(diningOptionDbInterface.repository, {
        name: diningOptionPayload.name,
        outletId: diningOption.outletId,
      });
    }

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.diningoptionFilePath, "images/")
        .replace(/\s/g, "");

      diningOptionPayload.image = image;
    }

    payloadValidation(UpdateDiningOptionPayload, diningOptionPayload);

    const updatedDiningOption =
      await diningOptionDbInterface.updateDiningOption(
        diningOption.id,
        diningOptionPayload,
        userId
      );

    const contentChange = contentChanges(
      diningOption.toJSON(),
      updatedDiningOption.toJSON()
    );

    const response = {
      ...updatedDiningOption.toJSON(),
      repeatOn: updatedDiningOption.repeatOn
        ? JSON.parse(updatedDiningOption.repeatOn)
        : [],
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Dining Option Updated Successfully",
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
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

//Delete DiningOption By Id
export const deleteDiningOption = async (
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
    const { diningOptionId, outletId } = params;
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

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const diningOptionDbInterface = new DiningOptionDbInterface(sequelize);

    const deletedDiningOption =
      await diningOptionDbInterface.deleteDiningOption(diningOptionId, userId);

    let contentChangesPayload: ContentChangesPayload = {
      name: deletedDiningOption.name ? deletedDiningOption.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      diningOptionId,
      deletedDiningOption,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Dining Option Deleted Successfully",
        data: deletedDiningOption.id,
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

//Get All DiningOption by companyId
export const getAllDiningOptionByCompanyId = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, body, uniqueId);

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

    const getAllDinningOptions: GetAllSectionsRequest = body;

    const diningOptionDbInterface = new DiningOptionDbInterface(sequelize);

    let diningOptions =
      await diningOptionDbInterface.getAllDiningOptionsByCompanyId(
        getAllDinningOptions.companyIds
      );

    diningOptions = uniqBy(diningOptions, "name");

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      body,
      diningOptions,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: diningOptions,
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
