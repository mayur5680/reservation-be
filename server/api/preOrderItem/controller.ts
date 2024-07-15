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
import { PreOrderItemRequestPayload } from "../../@types/preOrderItem";
import { getGuid } from "../../context/service";
import { PreOrderItem } from "../../db/interface";
import {
  PreOrderItemDbInterface,
  UserDbInterface,
  SectionDbInterface,
  OutletDbInterface,
  CompanyDbInterface,
} from "../../db-interfaces";
import { imageLocation } from "../../config";
import { Log } from "../../context/Logs";
import { CreatePreOrderItemPayload } from "../../validation";
import { getAdminUser, nameValidation, payloadValidation } from "../shared";
import { uniqBy } from "lodash";
import { GetAllSectionsRequest } from "../../@types/section";
import { ContentChangesPayload } from "../../@types/customer";
let moment = require("moment-timezone");

const moduleName = "PreOrder";

//File Upload
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageLocation.itemFilePath);
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

//Create PreOrderItem
export const createPreOrderItem = async (
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

    const preOrderItem: PreOrderItemRequestPayload = body;

    const image = req.file.path
      .replace(imageLocation.itemFilePath, "images/")
      .replace(/\s/g, "");

    preOrderItem.image = image;
    preOrderItem.outletId = outletId;

    payloadValidation(CreatePreOrderItemPayload, preOrderItem);

    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

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

    const sectionIds: number[] = [];
    if (preOrderItem.sectionId) {
      const ids = preOrderItem.sectionId.split(",");
      ids.map((id) => {
        sectionIds.push(Number(id));
      });
    }

    const preOrderItemDbInterface = new PreOrderItemDbInterface(sequelize);

    //Check Item Name
    await Promise.all(
      sectionIds.map(async (sectionId) => {
        await nameValidation(preOrderItemDbInterface.repository, {
          name: preOrderItem.name,
          sectionId: sectionId,
        });
      })
    );

    const startDate = new Date(
      moment(preOrderItem.startDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day")
    );

    const endDate = new Date(
      moment(preOrderItem.endDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day")
    );

    preOrderItem.startDate = startDate;
    preOrderItem.endDate = endDate;

    const sectionDbInterface = new SectionDbInterface(sequelize);
    const section = await sectionDbInterface.getSectionByIds(sectionIds);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Section Found",
      uniqueId
    );

    delete preOrderItem.sectionId;

    const createPreOrderItem = (
      await preOrderItemDbInterface.create(preOrderItem, sectionIds, userId)
    ).map((preOrderItem) => {
      return {
        ...preOrderItem.toJSON(),
        repeatOn: JSON.parse(preOrderItem.repeatOn),
      };
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      createPreOrderItem,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "PreOrderItem Created Successfully",
        data: createPreOrderItem,
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

//Get All PreOrderItem
export const getAllPreOrderItem = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);

    const userId = decoded.userDetail.id;
    const outletId = params.outletId;

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

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const preOrderItemDbInterface = new PreOrderItemDbInterface(sequelize);
    const getAllPreOrderItem = (
      await preOrderItemDbInterface.getAllPreOrderItemByOutletId(outlet.id)
    ).map((preOrderItem) => {
      return {
        ...preOrderItem.toJSON(),
        repeatOn: preOrderItem.repeatOn
          ? JSON.parse(preOrderItem.repeatOn)
          : [],
      };
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      getAllPreOrderItem,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getAllPreOrderItem,
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

//Update PreOrder By Id
export const updatePreOrderItem = async (
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
    const { preOrderItemId, outletId } = params;

    const userId = decoded.userDetail.id;

    const preOrderItem: PreOrderItem = body;

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

    const sectionDbInterface = new SectionDbInterface(sequelize);
    const section = await sectionDbInterface.getSectionById(
      preOrderItem.sectionId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Section Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    preOrderItem.outletId = outletId;
    const preOrderItemDbInterface = new PreOrderItemDbInterface(sequelize);
    const preOrder = await preOrderItemDbInterface.getPreOrderItemById(
      preOrderItemId,
      false
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "PreOrder Found",
      uniqueId
    );

    if (preOrder.name !== preOrderItem.name) {
      //Check Item Name
      await nameValidation(preOrderItemDbInterface.repository, {
        name: preOrderItem.name,
        sectionId: preOrderItem.sectionId,
      });
    }

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.itemFilePath, "images/")
        .replace(/\s/g, "");
      preOrderItem.image = image;
    }

    const startDate = new Date(
      moment(preOrderItem.startDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .startOf("day")
    );

    const endDate = new Date(
      moment(preOrderItem.endDate, "DD-MM-YYYY")
        .tz(outlet.timezone)
        .endOf("day")
    );

    preOrderItem.startDate = startDate;
    preOrderItem.endDate = endDate;

    const updatedPreOrderItem = (
      await preOrderItemDbInterface.updatePreOrderItem(
        preOrder.id,
        preOrderItem,
        userId
      )
    ).toJSON();

    const response = {
      ...updatedPreOrderItem,
      repeatOn: JSON.parse(updatedPreOrderItem.repeatOn),
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
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "PreOrderItem Updated Successfully",
        data: { ...response, Section: section },
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

//Delete PreOrder By Id
export const deletePreOrderItem = async (
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
    const { preOrderItemId, outletId } = params;
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

    const preOrderItemDbInterface = new PreOrderItemDbInterface(sequelize);
    const preOrderItem = await preOrderItemDbInterface.getPreOrderItemById(
      preOrderItemId,
      false
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const deletedPreOrderItem =
      await preOrderItemDbInterface.deletePreOrderItem(preOrderItem.id, userId);

    let contentChangesPayload: ContentChangesPayload = {
      name: deletedPreOrderItem.name ? deletedPreOrderItem.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      preOrderItemId,
      deletedPreOrderItem,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "PreOrderItem Deleted Successfully",
        data: deletedPreOrderItem.id,
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

//Get All PreOrder by companyId
export const getAllPreOrderItemByCompanyId = async (
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

    const getAllSectionsRequest: GetAllSectionsRequest = body;

    const companyDbInterface = new CompanyDbInterface(sequelize);

    const preOrderItemDbInterface = new PreOrderItemDbInterface(sequelize);

    let getPreOrderItems =
      await preOrderItemDbInterface.getAllPreOrderItemByCompanyId(
        getAllSectionsRequest.companyIds
      );

    getPreOrderItems = uniqBy(getPreOrderItems, "name");

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      body,
      getPreOrderItems,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getPreOrderItems,
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
