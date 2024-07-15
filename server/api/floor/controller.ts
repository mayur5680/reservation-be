import { Response, NextFunction } from "express";
import multer from "multer";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  LogTypes,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import { Floor } from "../../db/interface";
import {
  UserDbInterface,
  OutletDbInterface,
  FloorDbInterface,
} from "../../db-interfaces";
import { imageLocation } from "../../config";
import { imageSize } from "image-size";

const moduleName = "Floor";

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

export const createFloor = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { sequelize, decoded, body, params } = req;

    sequelizeValidate(sequelize, res);

    const outletId = params.outletId;
    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    const user = await userDbInterface.checkUserById(userId);

    const outletDbInterface = new OutletDbInterface(sequelize);
    const outlet = await outletDbInterface.getOutletbyId(outletId);

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const floor: Floor = body;

    const dimensions = imageSize(req.file.path);

    const image = req.file.path
      .replace(imageLocation.floorFilePath, "images/")
      .replace(/\s/g, "");

    floor.image = image;
    floor.outletId = outletId;
    floor.height = dimensions.height?.toString();
    floor.width = dimensions.width?.toString();

    const floorDbInterface = new FloorDbInterface(sequelize);
    const createFloor = await floorDbInterface.create(floor, userId);

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Floor Created Successfully",
        data: createFloor,
      })
    );
  } catch (error) {
    return catchErrorResponse(error, res);
  }
};

export const getAllFloor = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { sequelize, decoded, params } = req;

    sequelizeValidate(sequelize, res);

    const userId = decoded.userDetail.id;
    const outletId = params.outletId;

    const userDbInterface = new UserDbInterface(sequelize);
    const user = await userDbInterface.checkUserById(userId);

    const outletDbInterface = new OutletDbInterface(sequelize);
    const outlet = await outletDbInterface.getOutletbyId(outletId);

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }
    const floorDbInterface = new FloorDbInterface(sequelize);
    const getFloors = await floorDbInterface.getAllFloor(outletId);

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getFloors,
      })
    );
  } catch (error) {
    return catchErrorResponse(error, res);
  }
};

//Update Floor By Id
export const updateFloor = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { sequelize, body, decoded, params } = req;
    const { floorId, outletId } = params;

    sequelizeValidate(sequelize, res);

    const userId = decoded.userDetail.id;

    const floor: Floor = body;

    const userDbInterface = new UserDbInterface(sequelize);
    const user = await userDbInterface.checkUserById(userId);

    const outletDbInterface = new OutletDbInterface(sequelize);
    const outlet = await outletDbInterface.getOutletbyId(outletId);

    const floorDbInterface = new FloorDbInterface(sequelize);
    await floorDbInterface.getFloorById(floorId, false);

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    floor.outletId = outletId;

    if (req.file) {
      const dimensions = imageSize(req.file.path);
      const image = req.file.path
        .replace(imageLocation.floorFilePath, "images/")
        .replace(/\s/g, "");
      floor.image = image;

      floor.height = dimensions.height?.toString();
      floor.width = dimensions.width?.toString();
    }

    const updatedFloor = await floorDbInterface.updateFloor(
      floorId,
      floor,
      userId
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Floor Updated Successfully",
        data: updatedFloor,
      })
    );
  } catch (error) {
    return catchErrorResponse(error, res);
  }
};

//Delete Floor By Id
export const deleteFloor = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { sequelize, decoded, params } = req;
    const { floorId, outletId } = params;

    sequelizeValidate(sequelize, res);

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    const user = await userDbInterface.checkUserById(userId);

    const outletDbInterface = new OutletDbInterface(sequelize);
    const outlet = await outletDbInterface.getOutletbyId(outletId);

    const floorDbInterface = new FloorDbInterface(sequelize);
    await floorDbInterface.getFloorById(floorId, false);

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const deletedFloor = await floorDbInterface.deleteFloor(floorId, userId);

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Floor Deleted Successfully",
        data: deletedFloor.id,
      })
    );
  } catch (error) {
    return catchErrorResponse(error, res);
  }
};
