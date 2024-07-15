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
import {
  UserDbInterface,
  OutletDbInterface,
  OutletSeatingTypeDbInterface,
  OutletTableDbInterface,
  GroupTableDbInterface,
  GroupPossibilityDbInterface,
  OutletGroupDbInterface,
  GroupSequnceDbInterface,
} from "../../db-interfaces";
import {
  CreateGroupTablePayload,
  UpdateGroupTablePayload,
  AddPossibiltyPayload,
} from "../../@types/groupTable";
import { Log } from "../../context/Logs";
import { contentChanges, getAdminUser } from "../shared";
import { GroupTable } from "../../db/interface";
import { ContentChangesPayload } from "../../@types/customer";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";

const moduleName = "GroupTable";

//Create Group Table
export const createGroupTable = async (
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

    const outletseatingId = params.outletSeatingTypeId;

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

    const outletSeatingTypeDbInterface = new OutletSeatingTypeDbInterface(
      sequelize
    );

    //Check OutletSeatingType
    const outletSeatingType =
      await outletSeatingTypeDbInterface.getOutletSeatingById(outletseatingId);

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

    const createGroupTablePayload: CreateGroupTablePayload = body;

    //check Tables
    const outletTableDbInterface = new OutletTableDbInterface(sequelize);

    const checkTables =
      await outletTableDbInterface.getOutletTableByIdAndOutletSeatingTypeId(
        createGroupTablePayload.outletTable,
        outletSeatingType.id
      );

    if (createGroupTablePayload.outletTable.length !== checkTables) {
      throw new ApiError({
        message: Exceptions.INVALID_TABLE,
        statusCode: StatusCode.NOTFOUND,
      });
    }
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "All Tables Found",
      uniqueId
    );

    //Create Group Table
    const groupTableDbInterface = new GroupTableDbInterface(sequelize);
    const groupTablePayload: GroupTable = {
      outletSeatingTypeId: outletSeatingType.id,
      name: createGroupTablePayload.name,
      minPax: createGroupTablePayload.minPax,
      maxPax: createGroupTablePayload.maxPax,
      createdBy: user.id,
      updatedBy: user.id,
    };
    const createGroupTable = await groupTableDbInterface.create(
      groupTablePayload
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Group Table Created",
      uniqueId
    );

    const groupSequnceDbInterface = new GroupSequnceDbInterface(sequelize);

    //create Group Sequence
    const createGroupSequneceTable = await groupSequnceDbInterface.create(
      createGroupTablePayload.outletTable,
      createGroupTable.id,
      userId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Group Sequence Table Created",
      uniqueId
    );

    const groupPossibilityDbInterface = new GroupPossibilityDbInterface(
      sequelize
    );
    const outletGroupDbInterface = new OutletGroupDbInterface(sequelize);

    const results = getCombinations(createGroupTablePayload.outletTable);

    Log.writeLog(Loglevel.INFO, moduleName, "results", results, uniqueId);

    await Promise.all(
      results.map(async (possibility, index) => {
        const createGroupPossibility = await groupPossibilityDbInterface.create(
          createGroupTable.id,
          index + 1,
          userId
        );
        await outletGroupDbInterface.create(
          possibility,
          createGroupPossibility.id,
          userId
        );
      })
    );

    const getGroupTable = await groupTableDbInterface.getGroupTableById(
      createGroupTable.id,
      false
    );

    // let contentChangesPayload: ContentChangesPayload = {
    //   name: getGroupTable.name ? getGroupTable.name : "",
    //   contentChange: [],
    // };

    //const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      getGroupTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Group Created Successfully",
        data: getGroupTable,
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

//Get All Group Table
export const getAllGroupTable = async (
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

    const groupTableDbInterface = new GroupTableDbInterface(sequelize);
    const getAllGroupTable = await groupTableDbInterface.getAllGroupTableById(
      outletSeatingType.id,
      false
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      decoded,
      getAllGroupTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getAllGroupTable,
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

//Update Group Table
export const updateGroupTable = async (
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
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      { body, params },
      uniqueId
    );

    const { outletSeatingTypeId, groupTableId } = params;
    const userId = decoded.userDetail.id;

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

    //Check Outlet
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

    //Check Group
    const groupTableDbInterface = new GroupTableDbInterface(sequelize);
    const groupTable = await groupTableDbInterface.getGroupTableById(
      groupTableId,
      false
    );
    Log.writeLog(
      Loglevel.INFO,
      "AddPossibiltes",
      Actions.UPDATED,
      "Group Found",
      uniqueId
    );

    const updateGroupTablePayload: UpdateGroupTablePayload = body;

    const groupTablePayload: GroupTable = {
      outletSeatingTypeId: outletSeatingType.id,
      name: updateGroupTablePayload.name,
      minPax: updateGroupTablePayload.minPax,
      maxPax: updateGroupTablePayload.maxPax,
      isActive: updateGroupTablePayload.isActive,
      updatedBy: user.id,
    };

    const updatedGroupTable = await groupTableDbInterface.updateGroupTable(
      groupTable.id,
      groupTablePayload
    );

    const contentChange = contentChanges(
      groupTable.toJSON(),
      updatedGroupTable.toJSON()
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      { body, params },
      updatedGroupTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Group Updated Successfully",
        data: updatedGroupTable,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.UPDATED,
      { body, params },
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

//Delete Group Table
export const deleteGroupTable = async (
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
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      { decoded, params },
      uniqueId
    );

    const { outletSeatingTypeId, groupTableId } = params;
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
      Actions.DELETED,
      "OutletSeatingType Found",
      uniqueId
    );

    //Check Outlet
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

    //Check Group
    const groupTableDbInterface = new GroupTableDbInterface(sequelize);
    const groupTable = await groupTableDbInterface.getGroupTableById(
      groupTableId,
      false
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "Group Found",
      uniqueId
    );

    const groupSequnceDbInterface = new GroupSequnceDbInterface(sequelize);
    const groupPossibilityDbInterface = new GroupPossibilityDbInterface(
      sequelize
    );
    const outletGroupDbInterface = new OutletGroupDbInterface(sequelize);

    const deleteGroupTable = await groupTableDbInterface.deleteGroupTableById(
      groupTable,
      groupSequnceDbInterface,
      groupPossibilityDbInterface,
      outletGroupDbInterface,
      user.id
    );

    let contentChangesPayload: ContentChangesPayload = {
      name: deleteGroupTable.name ? deleteGroupTable.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      { decoded, params },
      deleteGroupTable.id,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Group Deleted Successfully",
        data: deleteGroupTable.id,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.DELETED,
      { decoded, params },
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

//Add Possibilties
export const AddPossibiltes = async (
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
      "AddPossibility",
      Actions.CREATED,
      body,
      uniqueId
    );

    const { outletSeatingTypeId, groupTableId } = params;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      "AddPossibility",
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
      "AddPossibility",
      Actions.CREATED,
      "OutletSeatingType Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletSeatingType.outletId);
    Log.writeLog(
      Loglevel.INFO,
      "AddPossibility",
      Actions.CREATED,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const addPossibiltyPayload: AddPossibiltyPayload = body;

    //Check Group
    const groupTableDbInterface = new GroupTableDbInterface(sequelize);
    const groupTable = await groupTableDbInterface.getGroupTableById(
      groupTableId,
      false
    );
    Log.writeLog(
      Loglevel.INFO,
      "AddPossibility",
      Actions.CREATED,
      "Group Found",
      uniqueId
    );

    //check Tables Present in Grouptable
    const groupSequnceDbInterface = new GroupSequnceDbInterface(sequelize);
    await Promise.all(
      addPossibiltyPayload.outletTable.map(async (table) => {
        await groupSequnceDbInterface.getSequenceByGroupIdAndTableId(
          groupTable.id,
          table
        );
      })
    );

    const groupPossibilityDbInterface = new GroupPossibilityDbInterface(
      sequelize
    );
    const outletGroupDbInterface = new OutletGroupDbInterface(sequelize);

    //Check Possibility Already exist or not
    await groupPossibilityDbInterface.checkPossibilityExists(
      groupTable.id,
      addPossibiltyPayload.outletTable
    );

    const createGroupPossibility = await groupPossibilityDbInterface.create(
      groupTable.id,
      1,
      userId
    );

    await outletGroupDbInterface.create(
      addPossibiltyPayload.outletTable,
      createGroupPossibility.id,
      userId
    );

    const getGroupTable = await groupTableDbInterface.getGroupTableById(
      groupTable.id,
      false
    );

    Log.writeExitLog(
      Loglevel.INFO,
      "AddPossibility",
      Actions.CREATED,
      body,
      getGroupTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Possibility Added Successfully",
        data: getGroupTable,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "AddPossibility",
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

//Delete Possibilties
export const DeletePossibiltes = async (
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
      "DeletePossibility",
      Actions.DELETED,
      body,
      uniqueId
    );

    const { outletSeatingTypeId, groupTableId, groupPossibilityId } = params;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      "DeletePossibility",
      Actions.DELETED,
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
      "DeletePossibility",
      Actions.DELETED,
      "OutletSeatingType Found",
      uniqueId
    );

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletSeatingType.outletId);
    Log.writeLog(
      Loglevel.INFO,
      "DeletePossibility",
      Actions.DELETED,
      "Outlet Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    //Check Group
    const groupTableDbInterface = new GroupTableDbInterface(sequelize);
    const groupTable = await groupTableDbInterface.getGroupTableById(
      groupTableId,
      false
    );
    Log.writeLog(
      Loglevel.INFO,
      "DeletePossibility",
      Actions.DELETED,
      "Group Found",
      uniqueId
    );

    const outletGroupDbInterface = new OutletGroupDbInterface(sequelize);
    const groupPossibilityDbInterface = new GroupPossibilityDbInterface(
      sequelize
    );

    const deletedPossibilites =
      await groupPossibilityDbInterface.deleteGroupPossibility(
        groupPossibilityId,
        groupTable.id,
        outletGroupDbInterface,
        user.id
      );

    const getGroupTable = await groupTableDbInterface.getGroupTableById(
      groupTable.id,
      false
    );

    Log.writeExitLog(
      Loglevel.INFO,
      "DeletePossibiltes",
      Actions.DELETED,
      body,
      getGroupTable,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Possibility Deleted Successfully",
        data: getGroupTable,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "DeletePossibiltes",
      Actions.DELETED,
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

const getCombinations = (valuesArray: number[]) => {
  let result = [];
  for (let i = 0; i < valuesArray.length; i++) {
    for (let j = i + 2; j <= valuesArray.length; j++) {
      result.push(valuesArray.slice(i, j));
    }
  }
  result = result.sort((a, b) => a.length - b.length);
  return result;
};
