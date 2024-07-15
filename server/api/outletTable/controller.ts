import { Response, NextFunction } from "express";
import multer from "multer";
import { sequelizeValidate, UpdateOutletTablePayloadd } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  LogTypes,
  Loglevel,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import { OutletTable } from "../../db/interface";
import {
  UserDbInterface,
  OutletDbInterface,
  OutletTableDbInterface,
  OutletSeatingTypeDbInterface,
  OutletSeatTypeDbInterface,
  TableDbInterface,
  OutletTablseSectionDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { UpdatePositionPayload } from "../../@types/outletTable";
import { nameValidation } from "../shared/nameValidation";
import { imageLocation } from "../../config";
import {
  contentChanges,
  getAdminUser,
  getUpdateBy,
  payloadValidation,
} from "../shared";
import { CreateOutletTablePayloadd } from "../../validation";
import { ContentChangesPayload } from "../../@types/customer";


const moduleName = "OutletTable";

//File Upload
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageLocation.tableFilePath);
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

//Create OutletTable
export const createOutletTable = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

    const outletSeatingTypeId = params.outletSeatingTypeId;
    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.CREATED,
      "User Found",
      uniqueId
    );

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );
    //Check OutletSeatingType
    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(
        outletSeatingTypeId
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "OutletSeatingType Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletSeatingType.outletId);
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

    const outletTable: OutletTable = body;
    outletTable.outletSeatingTypeId = outletSeatingType.id;

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.tableFilePath, "images/")
        .replace(/\s/g, "");

      outletTable.image = image;
      outletTable.isPrivate = true;
    }

    payloadValidation(CreateOutletTablePayloadd, outletTable);

    //Check OutletSeatType
    const outletSeatTypeDbInterface = new OutletSeatTypeDbInterface(sequelize);
    let outletSeatType;
    outletTable.outletSeatTypeId = parseInt(
      outletTable.outletSeatTypeId as unknown as string
    );

    if (
      outletTable.outletSeatTypeId &&
      !Number.isNaN(outletTable.outletSeatTypeId)
    ) {
      outletSeatType = await outletSeatTypeDbInterface.getOutletSeatById(
        outletTable.outletSeatTypeId
      );
    } else {
      delete outletTable.outletSeatTypeId;
    }

    //Check Table
    const tableDbInterface = new TableDbInterface(sequelize);
    const table = await tableDbInterface.getTableById(outletTable.tableId);

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);

    //Check OutletTable Check with Name
    await nameValidation(outletTableDbInterface.repository, {
      name: outletTable.name,
      outletSeatingTypeId: outletSeatingType.id,
    });

    //Create OutletTable

    const createOutletTable = (
      await outletTableDbInterface.create(outletTable, userId)
    ).toJSON();

    const Response = {
      ...createOutletTable,
      updatedBy: getUpdateBy(user),
      OutletSeatingType: outletSeatingType,
      OutletSeatType: outletSeatType,
      Table: table,
    };

    let contentChangesPayload: ContentChangesPayload = {
      name: Response.name ? Response.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      Response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Outlet Table Created Successfully",
        data: Response,
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

//Get All OutletTable
export const getAllOutletTable = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, decoded, uniqueId);

    const outletSeatingTypeId = params.outletSeatingTypeId;
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

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );
    //Check OutletSeatingType
    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(
        outletSeatingTypeId
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "OutletSeatingType Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(
        user.id,
        outletSeatingType.outletId
      );
    }

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);
    const getOutletTable = await outletTableDbInterface.getAllOutletTable(
      outletSeatingType.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      decoded,
      getOutletTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getOutletTable,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
      decoded,
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

//Get All OutletTableFor Private
export const getAllOutletTableForPrivate = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, decoded, uniqueId);

    const outletSeatingTypeId = params.outletSeatingTypeId;
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

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );
    //Check OutletSeatingType
    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(
        outletSeatingTypeId
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "OutletSeatingType Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(
        user.id,
        outletSeatingType.outletId
      );
    }

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);
    const getOutletTable =
      await outletTableDbInterface.getAllOutletTableForPrivate(
        outletSeatingType.id
      );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      decoded,
      getOutletTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getOutletTable,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
      decoded,
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

//Update OutletTable
export const updateOutletTable = async (
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

    const { outlettableId } = params;
    const userId = decoded.userDetail.id;

    const outletTable: OutletTable = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "User Found",
      uniqueId
    );

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);

    //check OutletTable
    const table = await outletTableDbInterface.getOutletTableById(
      outlettableId,
      false
    );

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );
    //Check OutletSeatingType
    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(
        table.outletSeatingTypeId
      );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "OutletSeatingType Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletSeatingType.outletId);
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

    if (table.name !== outletTable.name) {
      //Check OutletTable Check with Name
      await nameValidation(outletTableDbInterface.repository, {
        name: outletTable.name,
        outletSeatingTypeId: outletSeatingType.id,
      });
    }
    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.tableFilePath, "images/")
        .replace(/\s/g, "");

      outletTable.image = image;
      outletTable.isPrivate = true;
    }

    payloadValidation(UpdateOutletTablePayloadd, outletTable);

    //Check OutletSeatType
    const outletSeatTypeDbInterface = new OutletSeatTypeDbInterface(sequelize);
    let outletSeatType;
    outletTable.outletSeatTypeId = parseInt(
      outletTable.outletSeatTypeId as unknown as string
    );

    if (
      outletTable.outletSeatTypeId &&
      !Number.isNaN(outletTable.outletSeatTypeId)
    ) {
      outletSeatType = await outletSeatTypeDbInterface.getOutletSeatById(
        outletTable.outletSeatTypeId
      );
    } else {
      delete outletTable.outletSeatTypeId;
    }

    //Update OutletTable
    const updatedOutletTable = (
      await outletTableDbInterface.updateOutletTable(
        outlettableId,
        outletTable,
        userId
      )
    ).toJSON();

    const contentChange = contentChanges(table.toJSON(), updatedOutletTable);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updatedOutletTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Outlet Table Updated Successfully",
        data: updatedOutletTable,
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

//delete OutletTable
export const deleteOutletTable = async (
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

    const { outlettableId } = params;
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

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);

    //check OutletTable
    const table = await outletTableDbInterface.getOutletTableById(
      outlettableId,
      false
    );

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );

    //Check OutletSeatingType
    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(
        table.outletSeatingTypeId
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "OutletSeatingType Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletSeatingType.outletId);
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

    //Delete OutletTable
    const deletedOutletTable = await outletTableDbInterface.deleteOutletTable(
      outlettableId,
      userId
    );

    //Delete OutletTableSection
    const outletTablseSectionDbInterface = new OutletTablseSectionDbInterface(
      sequelize
    );

    // check if Table is Already there in Section
    await outletTablseSectionDbInterface.deleteOutletByOutletTableId(
      outlettableId
    );

    let contentChangesPayload: ContentChangesPayload = {
      name: deletedOutletTable.name ? deletedOutletTable.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      params,
      deletedOutletTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Outlet Table Deleted Successfully",
        data: deletedOutletTable.id,
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

//Update OutletTable Positions
export const updateOutletTablePosition = async (
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

    const outletSeatingTypeId = params.outletSeatingTypeId;
    const userId = decoded.userDetail.id;

    const updatePositionPayload: UpdatePositionPayload = body;

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
    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(
        outletSeatingTypeId
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "OutletSeatingType Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletSeatingType.outletId);
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

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);

    await outletTableDbInterface.updatePosition(updatePositionPayload, user.id);

    const getOutletTable = await outletTableDbInterface.getAllOutletTable(
      outletSeatingTypeId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      getOutletTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Outlet Table Updated Successfully",
        data: getOutletTable,
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
