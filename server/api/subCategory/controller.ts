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
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { getGuid } from "../../context/service";
import { SubCategory } from "../../db/interface";
import {
  UserDbInterface,
  SubCategoryDbInterface,
  CategoryDbInterface,
  OutletDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { nameValidation } from "../shared/nameValidation";
import { contentChanges, getAdminUser, getUpdateBy } from "../shared";
import { ContentChangesPayload } from "../../@types/customer";

const moduleName = "MaterialSubCategory";

export const createSubCategory = async (
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

    const subCategory: SubCategory = body;

    subCategory.outletId = outlet.id;

    const categoryDbInterface = new CategoryDbInterface(sequelize);
    const category = await categoryDbInterface.getCategoryById(
      subCategory.categoryId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Category Found",
      uniqueId
    );

    const subCategoryDbInterface = new SubCategoryDbInterface(sequelize);

    //Check Name Validation
    await nameValidation(subCategoryDbInterface.repository, {
      name: subCategory.name,
      categoryId: subCategory.categoryId,
    });

    const createSubCategory = (
      await subCategoryDbInterface.create(subCategory, userId)
    ).toJSON();

    let contentChangesPayload: ContentChangesPayload = {
      name: createSubCategory.name ? createSubCategory.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      createSubCategory,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "SubCategory Created Successfully",
        data: {
          ...createSubCategory,
          updatedBy: getUpdateBy(user),
          Category: category,
        },
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

export const getAllSubCategory = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, decoded, uniqueId);

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

    const subCategoryDbInterface = new SubCategoryDbInterface(sequelize);
    const getSubCategories = await subCategoryDbInterface.getAllSubCategory();

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      decoded,
      getSubCategories,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getSubCategories,
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

export const getAllByCategoryId = async (
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
    const { categoryId, outletId } = params;

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    const categoryDbInterface = new CategoryDbInterface(sequelize);
    const category = await categoryDbInterface.getCategoryById(categoryId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Category Found",
      uniqueId
    );

    if (category.outletId !== outlet.id) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Invalid Category",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const subCategoryDbInterface = new SubCategoryDbInterface(sequelize);
    const getSubCategories = await subCategoryDbInterface.getAllByCategoryId(
      category.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      getSubCategories,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getSubCategories,
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

export const updateSubCategory = async (
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
    const { subCategoryId, outletId } = params;

    const userId = decoded.userDetail.id;
    const subCategoryBody: SubCategory = body;

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
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const subCategoryDbInterface = new SubCategoryDbInterface(sequelize);
    const subCategory = await subCategoryDbInterface.getSubCategoryById(
      subCategoryId,
      false
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "SubCategory Found",
      uniqueId
    );

    if (subCategory.name !== subCategoryBody.name) {
      //Check OutletTable Check with Name
      await nameValidation(subCategoryDbInterface.repository, {
        name: subCategoryBody.name,
        categoryId: subCategoryBody.categoryId,
      });
    }

    const updatedSubCategory = await subCategoryDbInterface.updateSubCategory(
      subCategoryBody,
      subCategory.id,
      userId
    );

    const contentChange = contentChanges(
      subCategory.toJSON(),
      updatedSubCategory.toJSON()
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updatedSubCategory,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "SubCategory Updated Successfully",
        data: updatedSubCategory,
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

export const deleteSubCategory = async (
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
    const { subCategoryId } = params;

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

    const subCategoryDbInterface = new SubCategoryDbInterface(sequelize);
    const deletedSubCategory =
      await subCategoryDbInterface.deleteSubCategoryById(subCategoryId, userId);

    let contentChangesPayload: ContentChangesPayload = {
      name: deletedSubCategory.name ? deletedSubCategory.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      params,
      deletedSubCategory,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "SubCategory Deleted Successfully",
        data: deletedSubCategory.id,
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
