import { Response, NextFunction } from "express";
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
import { Tag, OutletTag } from "../../db/interface";
import {
  UserDbInterface,
  OutletDbInterface,
  TagDbInterface,
  OutletTagDbInterface,
  TagCategoryDbInterface,
  AutoTaggingDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { nameValidation } from "../shared/nameValidation";
import {
  contentChanges,
  deleteTags,
  getAdminUser,
  getUpdateBy,
} from "../shared";
import { uniqBy } from "lodash";
import { ContentChangesPayload } from "../../@types/customer";

const moduleName = "Tags";

export const createTag = async (
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

    const { outletId } = params;
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

    const tag: Tag = body;
    tag.outletId = outlet.id;

    const tagCategoryDbInterface = new TagCategoryDbInterface(sequelize);
    const tagCategory = await tagCategoryDbInterface.getTagCategoryById(
      tag.tagCategoryId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Category Found",
      uniqueId
    );

    const tagDbInterface = new TagDbInterface(sequelize);

    //Check Name Validation
    await nameValidation(tagDbInterface.repository, {
      name: tag.name,
      tagCategoryId: tag.tagCategoryId,
      outletId: outlet.id,
    });

    const createTag = (await tagDbInterface.create(tag, userId)).toJSON();

    const response = {
      ...createTag,
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
        message: "Tag Created Successfully",
        data: { ...response, TagCategory: tagCategory },
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

export const getAllTag = async (
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
    const { outletId } = params;

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
      Actions.CREATED,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const tagDbInterface = new TagDbInterface(sequelize);
    const gettags = await tagDbInterface.getAllTags(outlet.id);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      decoded,
      gettags,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: gettags,
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

export const getTagByCategory = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;

  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);
    const { tagCategoryId } = params;

    const tagCategoryDbInterface = new TagCategoryDbInterface(sequelize);
    const tagCategory = await tagCategoryDbInterface.getTagCategoryById(
      tagCategoryId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Category Found",
      uniqueId
    );

    const tagDbInterface = new TagDbInterface(sequelize);
    let gettags = await tagDbInterface.getAllTagsByCategoryId(tagCategory.id);

    gettags = uniqBy(gettags, "name");

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      gettags,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: gettags,
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

export const getTagByCategoryByoutletComapny = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;

  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);
    const { tagCategoryId, outletId, companyId } = params;
    const outletDbInterface = new OutletDbInterface(sequelize);

    let outletIds = [];
    let categoryId = null;
    if (companyId !== "null") {
      const outlets = await outletDbInterface.getAllOutletsByCompanyId(
        companyId
      );
      outletIds = outlets.map((outlet) => {
        return outlet.id;
      });
    } else {
      outletIds.push(outletId);
    }

    if (tagCategoryId !== "null") {
      const tagCategoryDbInterface = new TagCategoryDbInterface(sequelize);
      const tagCategory = await tagCategoryDbInterface.getTagCategoryById(
        tagCategoryId
      );
      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        Actions.CREATED,
        "Category Found",
        uniqueId
      );
      categoryId = tagCategory.id;
    }

    const tagDbInterface = new TagDbInterface(sequelize);
    let gettags = await tagDbInterface.getAllTagsByCategoryIdandOutletIds(
      categoryId,
      outletIds
    );

    if (gettags.length > 0) {
      gettags = uniqBy(gettags, "name");
    }

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      gettags,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: gettags,
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

export const updateTag = async (
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
    const { tagId, outletId } = params;

    const userId = decoded.userDetail.id;
    const tagBody: Tag = body;

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

    const tagDbInterface = new TagDbInterface(sequelize);
    const tag = await tagDbInterface.getTagById(tagId, false);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Tag Found",
      uniqueId
    );

    const tagCategoryDbInterface = new TagCategoryDbInterface(sequelize);
    const TagCategory = await tagCategoryDbInterface.getTagCategoryById(
      tag.tagCategoryId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Category Found",
      uniqueId
    );

    if (tag.name !== tagBody.name) {
      //Check OutletTable Check with Name
      await nameValidation(tagDbInterface.repository, {
        name: tagBody.name,
        tagCategoryId: tagBody.tagCategoryId,
        outletId: outlet.id,
      });
    }

    const updatedTags = await tagDbInterface.updateTag(
      tagBody,
      tagId,
      outlet.id,
      userId
    );

    const contentChange = contentChanges(tag.toJSON(), updatedTags.toJSON());

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updatedTags,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Tag Updated Successfully",
        data: updatedTags,
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

export const deleteTag = async (
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
    const { tagId, outletId } = params;

    const userId = decoded.userDetail.id;
    let repository = null;

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

    const tagDbInterface = new TagDbInterface(sequelize);
    const deletedTag = await tagDbInterface.deleteTag(tagId, outlet.id, userId);

    //delete AutoTag
    const autoTaggingDbInterface = new AutoTaggingDbInterface(sequelize);
    await autoTaggingDbInterface.deleteByTagId(deletedTag.id);

    //delete tag from other submodules
    await deleteTags(deletedTag, sequelize);

    let contentChangesPayload: ContentChangesPayload = {
      name: deletedTag.name ? deletedTag.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      tagId,
      deletedTag,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Tag Deleted Successfully",
        data: deletedTag.id,
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

//OutletTag

export const createOutletTag = async (
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
    Log.writeLog(Loglevel.INFO, "OutletTag", Actions.CREATED, body, uniqueId);

    const outletId = params.outletId;
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

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.CREATED,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const outletTag: OutletTag = body;
    outletTag.outletId = outletId;

    const tagDbInterface = new TagDbInterface(sequelize);
    const tag = await tagDbInterface.getTagById(outletTag.tagId);
    Log.writeLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.CREATED,
      "Tag Found",
      uniqueId
    );

    const outletTagDbInterface = new OutletTagDbInterface(sequelize);
    const createdOutletTag = (
      await outletTagDbInterface.create(outletTag, userId)
    ).toJSON();

    Log.writeExitLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.CREATED,
      body,
      createdOutletTag,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Tag Added Successfully",
        data: { ...createdOutletTag, Tag: tag },
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "OutletTag",
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

export const getAllOutletTag = async (
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
    Log.writeLog(Loglevel.INFO, "OutletTag", Actions.GET, params, uniqueId);

    const userId = decoded.userDetail.id;
    const outletId = params.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.GET,
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(userId, outlet.id);
    }

    const outletTagDbInterface = new OutletTagDbInterface(sequelize);
    const getOutletTags = await outletTagDbInterface.getAllOutletTag(outletId);

    Log.writeExitLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.GET,
      params,
      getOutletTags,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getOutletTags,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "OutletTag",
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

export const updateOutletTag = async (
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
    Log.writeLog(Loglevel.INFO, "OutletTag", Actions.UPDATED, body, uniqueId);
    const { outlettagId, outletId } = params;

    const userId = decoded.userDetail.id;
    const outletTag: OutletTag = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.UPDATED,
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.UPDATED,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const outletTagDbInterface = new OutletTagDbInterface(sequelize);
    const updatedOutletTag = await outletTagDbInterface.update(
      outlettagId,
      outletTag,
      userId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.UPDATED,
      body,
      updatedOutletTag,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Tag Updated Successfully",
        data: updatedOutletTag,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "OutletTag",
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

export const deleteOutletTag = async (
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
    Log.writeLog(Loglevel.INFO, "OutletTag", Actions.DELETED, params, uniqueId);
    const { outlettagId, outletId } = params;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.DELETED,
      "User Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.DELETED,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }
    const outletTagDbInterface = new OutletTagDbInterface(sequelize);
    const deletedOutletTag = await outletTagDbInterface.delete(
      outlettagId,
      userId
    );

    Log.writeExitLog(
      Loglevel.INFO,
      "OutletTag",
      Actions.DELETED,
      outlettagId,
      deletedOutletTag,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Tag Deleted Successfully",
        data: deletedOutletTag.id,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "OutletTag",
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
