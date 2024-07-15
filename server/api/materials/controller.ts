import { Response, NextFunction } from "express";
import multer from "multer";
import {
  sequelizeValidate,
  UpdateMaterialPayload,
  CreateMaterialPayload,
} from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  LogTypes,
  Loglevel,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { FilterMaterial } from "../../@types/materials";
import { getGuid } from "../../context/service";
import { Materials } from "../../db/interface";
import {
  UserDbInterface,
  OutletDbInterface,
  MaterialsDbInterface,
  CategoryDbInterface,
  SubCategoryDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { imageLocation } from "../../config";
import {
  contentChanges,
  getAdminUser,
  getUpdateBy,
  payloadValidation,
} from "../shared";
import { isEmpty } from "lodash";
import { Op } from "sequelize";

import { ContentChangesPayload } from "../../@types/customer";

const moduleName = "Materials";

//File Upload
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageLocation.materialFilePath);
  },
  filename: (req, file, cb) => {
    const getExtension = file.originalname.toString().split(".")[1];
    cb(null, getGuid() + "." + getExtension); //Appending .jpg
  },
});

export const upload = multer({
  storage: fileStorageEngine,
}).fields([
  { name: "attachment", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

//Create Materials
export const createMaterials = async (
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

    const materials: Materials = body;

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

    const categoryDbInterface = new CategoryDbInterface(sequelize);
    const category = await categoryDbInterface.getCategoryById(
      materials.categoryId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Category Found",
      uniqueId
    );

    const subCategoryDbInterface = new SubCategoryDbInterface(sequelize);
    const subCategory = await subCategoryDbInterface.getSubCategoryById(
      materials.subCategoryId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "SubCategory Found",
      uniqueId
    );

    if (subCategory.categoryId != category.id) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Category and Subcategory not match",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    if (req.files.attachment && req.files.attachment.length > 0) {
      const attachment = req.files.attachment[0].path
        .replace(imageLocation.materialFilePath, "images/")
        .replace(/\s/g, "");

      materials.attachment = attachment;
      materials.type = req.files.attachment[0].mimetype;
    }
    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      const thumbnail = req.files.thumbnail[0].path
        .replace(imageLocation.materialFilePath, "images/")
        .replace(/\s/g, "");

      materials.thumbnail = thumbnail;
    }

    materials.outletId = outletId;

    payloadValidation(CreateMaterialPayload, materials);

    const materialsDbInterface = new MaterialsDbInterface(sequelize);

    const createMaterial = (
      await materialsDbInterface.create(materials, userId)
    ).toJSON();

    const response = {
      ...createMaterial,
      updatedBy: getUpdateBy(user),
      tags: JSON.parse(createMaterial.tags),
      Category: category,
      SubCategory: subCategory,
    };

    let contentChangesPayload: ContentChangesPayload = {
      name: response.title ? response.title : "",
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
        message: "Materials Created Successfully",
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

//Get All Materials
export const getAllMaterials = async (
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

    const filterMaterial: FilterMaterial = body;

    let query: any = {
      outletId: outlet.id,
    };

    if (!isEmpty(filterMaterial.search)) {
      query = {
        outletId: outlet.id,
        [Op.or]: [
          {
            title: {
              [Op.like]: `%${filterMaterial.search}%`,
            },
          },
          {
            description: {
              [Op.like]: `%${filterMaterial.search}%`,
            },
          },
          {
            tags: {
              [Op.like]: `%${filterMaterial.search}%`,
            },
          },
        ],
      };
    }

    if (filterMaterial.categoryId) {
      query.categoryId = filterMaterial.categoryId;
    }
    if (filterMaterial.subCategoryId) {
      query.subCategoryId = filterMaterial.subCategoryId;
    }

    const materialsDbInterface = new MaterialsDbInterface(sequelize);
    const getAllMaterials = await materialsDbInterface.getAllMaterials(query);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      getAllMaterials,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getAllMaterials,
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

//Get Material By Id
export const getMaterial = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);

    const userId = decoded.userDetail.id;
    const materialId = params.materialId;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "User Found",
      uniqueId
    );

    const materialsDbInterface = new MaterialsDbInterface(sequelize);
    const material = (
      await materialsDbInterface.getMaterialById(materialId)
    ).toJSON();
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Material Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    const outlet = await outletDbInterface.getOutletbyId(material.outletId);
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

    const response = {
      ...material,
      tags: JSON.parse(material.tags),
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: response,
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

//update Material By Id
export const updateMaterials = async (
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
    Log.writeLog(Loglevel.INFO, moduleName, Actions.UPDATED, body, uniqueId);

    const materialId = params.materialId;
    const userId = decoded.userDetail.id;

    const materials: Materials = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "User Found",
      uniqueId
    );

    const materialsDbInterface = new MaterialsDbInterface(sequelize);
    const material = await materialsDbInterface.getMaterialById(materialId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Material Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(material.outletId);
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
    const categoryDbInterface = new CategoryDbInterface(sequelize);
    const category = await categoryDbInterface.getCategoryById(
      materials.categoryId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Category Found",
      uniqueId
    );

    const subCategoryDbInterface = new SubCategoryDbInterface(sequelize);
    const subCategory = await subCategoryDbInterface.getSubCategoryById(
      materials.subCategoryId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "SubCategory Found",
      uniqueId
    );

    if (subCategory.categoryId != category.id) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Category and Subcategory not match",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    if (req.files) {
      if (req.files.attachment && req.files.attachment.length > 0) {
        const attachment = req.files.attachment[0].path
          .replace(imageLocation.materialFilePath, "images/")
          .replace(/\s/g, "");

        materials.attachment = attachment;
        materials.type = req.files.attachment[0].mimetype;
      }

      if (req.files.thumbnail && req.files.thumbnail.length > 0) {
        const thumbnail = req.files.thumbnail[0].path
          .replace(imageLocation.materialFilePath, "images/")
          .replace(/\s/g, "");

        materials.thumbnail = thumbnail;
      }
    }

    payloadValidation(UpdateMaterialPayload, materials);

    const updatedMaterial = (
      await materialsDbInterface.updateMaterials(material.id, materials, userId)
    ).toJSON();

    const contentChange = contentChanges(material.toJSON(), updatedMaterial);

    const response = {
      ...updatedMaterial,
      tags: JSON.parse(updatedMaterial.tags),
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
        message: "Materials Updated Successfully",
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

//delete Material By Id
export const deleteMaterials = async (
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

    const materialId = params.materialId;
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

    const materialsDbInterface = new MaterialsDbInterface(sequelize);
    const material = await materialsDbInterface.getMaterialById(materialId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "Material Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(material.outletId);
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

    const deleltedMaterial = await materialsDbInterface.deleteMaterial(
      material.id,
      userId
    );

    let contentChangesPayload: ContentChangesPayload = {
      name: deleltedMaterial.title ? deleltedMaterial.title : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      params,
      deleltedMaterial,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Materials Deleted Successfully",
        data: deleltedMaterial.id,
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
