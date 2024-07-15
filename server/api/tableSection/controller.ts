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
import { TableSection } from "../../db/interface";
import {
  UserDbInterface,
  OutletDbInterface,
  OutletSeatingTypeDbInterface,
  TableSectionDbInterface,
  OutletTablseSectionDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { nameValidation } from "../shared/nameValidation";
import {
  CreatePrivateTableSectionPayload,
  CreateTableSectionPayload,
  UpdatePrivateTableSectionPayload,
} from "../../@types/tableSection";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { contentChanges, getAdminUser } from "../shared";
import { OutletTableSectionDbModel } from "../../db/models";
import { imageLocation } from "../../config";
import { ContentChangesPayload } from "../../@types/customer";

const moduleName = "TableSection";

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
}).single("image");

//Create OutletTable
export const createTableSection = async (
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

    const createTableSectionPayload: CreateTableSectionPayload = body;

    const outletTablseSectionDbInterface = new OutletTablseSectionDbInterface(
      sequelize
    );

    // check if Table is Already there in Section
    const outletTable =
      await outletTablseSectionDbInterface.getOutletTableSectionById(
        createTableSectionPayload.outletTable,
        false
      );

    if (outletTable.length > 0) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Table is already present in section",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const tableSection: TableSection = {
      name: createTableSectionPayload.name,
      color: createTableSectionPayload.color,
      description: createTableSectionPayload.description,
      outletSeatingTypeId: outletSeatingType.id,
      outletId: outlet.id,
      minPax: createTableSectionPayload.minPax,
      maxPax: createTableSectionPayload.maxPax,
    };

    const tableSectionDbInterface = new TableSectionDbInterface(sequelize);
    //Check Section Check with Name
    await nameValidation(
      tableSectionDbInterface.repository,
      {
        name: tableSection.name,
        outletSeatingTypeId: tableSection.outletSeatingTypeId,
        isPrivate: false,
      },
      [
        {
          model: OutletTableSectionDbModel,
          where: { isActive: true },
          required: true,
        },
      ]
    );

    //Create Section
    const createTableSection = await tableSectionDbInterface.create(
      tableSection,
      userId
    );

    let contentChangesPayload: ContentChangesPayload = {
      name: createTableSection.name ? createTableSection.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    //Create OutletTableSection

    await Promise.all(
      await outletTablseSectionDbInterface.create(
        createTableSectionPayload.outletTable,
        createTableSection.id,
        user.id,
        outletSeatingType.id
      )
    );

    const getTableSection = await tableSectionDbInterface.getTablSectioneById(
      createTableSection.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      getTableSection,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Table Section Created Successfully",
        data: getTableSection,
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

//Get All TableSection
export const getAllTableSection = async (
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

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletSeatingType.outletId);
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

    const tableSectionDbInterface = new TableSectionDbInterface(sequelize);
    const getTableSection = await tableSectionDbInterface.getAllTableSection(
      outletSeatingType.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      decoded,
      getTableSection,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getTableSection,
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

//Update TableSection
export const updateTableSection = async (
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
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      { params, body },
      uniqueId
    );

    const { tablesectionId, outletSeatingTypeId } = params;
    const userId = decoded.userDetail.id;

    const updatePrivateTableSectionPayload: UpdatePrivateTableSectionPayload =
      body;

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

    const tableSectionDbInterface = new TableSectionDbInterface(sequelize);

    //check TableSection
    const section = await tableSectionDbInterface.getTablSectioneById(
      tablesectionId,
      false
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "TableSection Found",
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

    if (section.name !== updatePrivateTableSectionPayload.name) {
      //Check Name
      await nameValidation(
        tableSectionDbInterface.repository,
        {
          name: updatePrivateTableSectionPayload.name,
          outletSeatingTypeId: outletSeatingType.id,
          isPrivate: true,
        },
        [
          {
            model: OutletTableSectionDbModel,
            where: { isActive: true },
            required: true,
          },
        ]
      );
    }

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.tableFilePath, "images/")
        .replace(/\s/g, "");

      updatePrivateTableSectionPayload.image = image;
    }

    const tableSectionPayload: TableSection = {
      name: updatePrivateTableSectionPayload.name,
      color: updatePrivateTableSectionPayload.color,
      outletSeatingTypeId: outletSeatingType.id,
      description: updatePrivateTableSectionPayload.description,
      minPax: updatePrivateTableSectionPayload.minPax,
      maxPax: updatePrivateTableSectionPayload.maxPax,
      isActive: updatePrivateTableSectionPayload.isActive,
      image: updatePrivateTableSectionPayload.image,
      originalPrice: updatePrivateTableSectionPayload.originalPrice,
      price: updatePrivateTableSectionPayload.price,
      blockTime: updatePrivateTableSectionPayload.blockTime,
    };

    //Update TableSection
    const updatedTableSection = (
      await tableSectionDbInterface.updateTableSection(
        tablesectionId,
        tableSectionPayload,
        userId
      )
    ).toJSON();

    const contentChange = contentChanges(section.toJSON(), updatedTableSection);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updatedTableSection,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "TableSection Updated Successfully",
        data: updatedTableSection,
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

//Delete TableSection
export const deleteTableSection = async (
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

    const { tablesectionId } = params;
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

    const tableSectionDbInterface = new TableSectionDbInterface(sequelize);

    //check TableSection
    const section = await tableSectionDbInterface.getTablSectioneById(
      tablesectionId,
      false
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "TableSection Found",
      uniqueId
    );

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );

    //Check OutletSeatingType
    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(
        section.outletSeatingTypeId
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

    const outletTablseSectionDbInterface = new OutletTablseSectionDbInterface(
      sequelize
    );

    //Delete OutletTable
    const deletedTableSection =
      await tableSectionDbInterface.deleteTableSection(
        tablesectionId,
        outletTablseSectionDbInterface,
        userId
      );

    let contentChangesPayload: ContentChangesPayload = {
      name: deletedTableSection.name ? deletedTableSection.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      params,
      deletedTableSection,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    let message = "TableSection Deleted Successfully";
    if (deletedTableSection.isPrivate === true) {
      message = "Private Room Deleted Successfully";
    }
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: message,
        data: deletedTableSection.id,
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

//Create Private Section
export const createPrivateTableSection = async (
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

    const createTableSectionPayload: CreatePrivateTableSectionPayload = body;

    const outletTablseSectionDbInterface = new OutletTablseSectionDbInterface(
      sequelize
    );

    const outletTablesIds: number[] = [];
    if (createTableSectionPayload.outletTables) {
      const ids = createTableSectionPayload.outletTables.split(",");
      ids.map((id) => {
        outletTablesIds.push(Number(id));
      });
    }

    // check if Table is Already there in Section
    const outletTable =
      await outletTablseSectionDbInterface.getOutletTableSectionById(
        outletTablesIds
      );

    if (outletTable.length > 0) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: "Table is already present in another private room",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.tableFilePath, "images/")
        .replace(/\s/g, "");

      createTableSectionPayload.image = image;
    }

    const tableSection: TableSection = {
      name: createTableSectionPayload.name,
      color: createTableSectionPayload.color,
      description: createTableSectionPayload.description,
      outletSeatingTypeId: outletSeatingType.id,
      outletId: outlet.id,
      minPax: createTableSectionPayload.minPax,
      maxPax: createTableSectionPayload.maxPax,
      image: createTableSectionPayload.image,
      originalPrice: createTableSectionPayload.originalPrice,
      price: createTableSectionPayload.price,
      blockTime: createTableSectionPayload.blockTime,
      isPrivate: true,
    };

    const tableSectionDbInterface = new TableSectionDbInterface(sequelize);
    //Check Section Check with Name
    await nameValidation(
      tableSectionDbInterface.repository,
      {
        name: tableSection.name,
        outletSeatingTypeId: tableSection.outletSeatingTypeId,
        isPrivate: true,
      },
      [
        {
          model: OutletTableSectionDbModel,
          where: { isActive: true },
          required: true,
        },
      ]
    );

    //Create Section
    const createTableSection = await tableSectionDbInterface.create(
      tableSection,
      userId
    );

    //Create OutletTableSection

    await Promise.all(
      await outletTablseSectionDbInterface.create(
        outletTablesIds,
        createTableSection.id,
        user.id,
        outletSeatingType.id,
        true
      )
    );

    const getTableSection = await tableSectionDbInterface.getTablSectioneById(
      createTableSection.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      getTableSection,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Private Room Created Successfully",
        data: getTableSection,
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

//Get All Private Section By Outlet Id
export const getAllPrivateTableSection = async (
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

    const outletId = params.outletId;
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
      Actions.GET,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const tableSectionDbInterface = new TableSectionDbInterface(sequelize);
    const getTableSection =
      await tableSectionDbInterface.getAllPrivateTableSection(outlet.id);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      decoded,
      getTableSection,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getTableSection,
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
