import { Response, NextFunction } from "express";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  Loglevel,
  LogTypes,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import { AutoTagging } from "../../db/interface";
import {
  UserDbInterface,
  OutletDbInterface,
  AutoTaggingDbInterface,
  TagDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { CriteriaPayload } from "../../@types/marketing";
import {
  customerAutoTagCriteria,
  deleteTags,
  getAdminUser,
  getUpdateBy,
} from "../shared";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { TagDbModel } from "../../db/models";

const moduleName = "AutoTagging";

//Create AutoTag
export const createAutoTagging = async (
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

    const userId = decoded.userDetail.id;
    const outletId = params.outletId;

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

    const autoTagging: AutoTagging = body;
    autoTagging.outletId = outlet.id;

    const tagDbInterface = new TagDbInterface(sequelize);
    const tag = await tagDbInterface.getTagById(autoTagging.tagId, false);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Tag Found",
      uniqueId
    );

    const autoTaggingDbInterface = new AutoTaggingDbInterface(sequelize);

    const checkTag = await autoTaggingDbInterface.getAutoTagByTagIdAndOutletId(
      outlet.id,
      tag.id
    );

    if (checkTag) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Tag already exists",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    autoTagging.criteria = JSON.stringify(autoTagging.criteria);

    const createAutoTag = (
      await autoTaggingDbInterface.create(autoTagging, user.id)
    ).toJSON();

    const response = {
      ...createAutoTag,
      criteria: JSON.parse(createAutoTag.criteria),
      updatedBy: getUpdateBy(user),
      Tag: tag,
    };

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
      outlet
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "AutoTag Created Successfully",
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

//Get All Auto Tags
export const getAllAutoTagging = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, body, decoded } = req;
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

    const userId = decoded.userDetail.id;
    const outletId = params.outletId;

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
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const autoTaggingDbInterface = new AutoTaggingDbInterface(sequelize);
    const autoTags = (
      await autoTaggingDbInterface.getAllAutoTags(outlet.id)
    ).map((tag) => {
      return {
        ...tag.toJSON(),
        criteria: JSON.parse(tag.criteria),
      };
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      autoTags,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: autoTags,
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

//Delete AutoTag By Id
export const deleteAutotag = async (
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
    const { autoTagId, outletId } = params;

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

    const autoTaggingDbInterface = new AutoTaggingDbInterface(sequelize);

    const deletedAutoTaged = await autoTaggingDbInterface.delete(
      autoTagId,
      user.id
    );

    await deleteTags(deletedAutoTaged.Tag as TagDbModel, sequelize);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      params,
      deletedAutoTaged,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "AutoTag Deleted Successfully",
        data: deletedAutoTaged.id,
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

//Customer List
export const getCustomerList = async (
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
    const { autoTagId } = params;

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

    const autoTaggingDbInterface = new AutoTaggingDbInterface(sequelize);

    let autoTag = (
      await autoTaggingDbInterface.getAutoTagById(autoTagId, false)
    ).toJSON();

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "AutoTag Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(autoTag.outletId);
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

    autoTag = {
      ...autoTag,
      criteria: JSON.parse(autoTag.criteria),
    };

    const criteriaPayload: CriteriaPayload[] = autoTag.criteria;

    const customers = (
      await customerAutoTagCriteria(
        criteriaPayload,
        outlet,
        uniqueId,
        sequelize
      )
    ).map((customer) => {
      return {
        ...customer.toJSON(),
        tags: customer.tags ? JSON.parse(customer.tags) : null,
      };
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      customers,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: customers,
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
