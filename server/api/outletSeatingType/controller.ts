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
import { OutletSeatingType } from "../../db/interface";
import {
  UserDbInterface,
  OutletDbInterface,
  OutletSeatingTypeDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { imageLocation } from "../../config";
import { imageSize } from "image-size";
import { contentChanges, getAdminUser } from "../shared";

const moduleName = "OutletSeatingType";

//File Upload
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageLocation.floorFilePath);
  },
  filename: (req, file, cb) => {
    const getExtension = file.originalname.toString().split(".")[1];
    cb(null, getGuid() + "." + getExtension);
  },
});

export const upload = multer({
  storage: fileStorageEngine,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg" ||
      file.mimetype == "image/svg+xml"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
  limits: { fileSize: 6000000 },
}).single("image");

//Update FloorImage By OutletSeatingTypeId
export const updateImage = async (
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
    const { outletseatingId } = params;

    const userId = decoded.userDetail.id;

    const outletSeatingType: OutletSeatingType = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "User Found",
      uniqueId
    );

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );
    //Check OutletSeatingType
    const seatingType = await outletSeatingTypeDbInterface.getOutletSeatingById(
      outletseatingId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "OutletSeatingType Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(seatingType.outletId);
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

    outletSeatingType.outletId = outlet.id;

    if (req.file) {
      const dimensions = imageSize(req.file.path);
      const image = req.file.path
        .replace(imageLocation.floorFilePath, "images/")
        .replace(/\s/g, "");

      outletSeatingType.image = image;

      outletSeatingType.height = dimensions.height?.toString();
      outletSeatingType.width = dimensions.width?.toString();
    }

    const uploadSeatingType = await outletSeatingTypeDbInterface.UploadImage(
      outletseatingId,
      outletSeatingType,
      userId
    );

    const contentChange = contentChanges(
      seatingType.toJSON(),
      uploadSeatingType.toJSON()
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      uploadSeatingType,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Image Uploaded Successfully",
        data: uploadSeatingType,
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
