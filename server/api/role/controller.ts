import { Response, NextFunction } from "express";
import {
  catchErrorResponse,
  StatusCode,
  LogTypes,
  Actions,
  Loglevel,
} from "../../context";
import { sequelizeValidate } from "../../validation";
import {
  RoleDbInterface,
  UserDbInterface,
  OutletDbInterface,
  UserPermissionDbInterface,
  OutletUserDbInterface,
} from "../../db-interfaces";
import { Role } from "../../db/interface";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import { Log } from "../../context/Logs";
import {
  contentChanges,
  getAdminUser,
  getUpdateBy,
  userDeletion,
} from "../shared";
import { defaultPermission } from "../../@types/userPermission";
import { ContentChangesPayload } from "../../@types/customer";


const moduleName = "UserGroup";

//Create New Role by super Admin
export const createRole = async (
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

    const role: Role = body;
    const roleDbInterface = new RoleDbInterface(sequelize);
    const createRole = await roleDbInterface.createRole(role, outletId, userId);

    //create permission
    const userPermissionDbInterface = new UserPermissionDbInterface(sequelize);
    await userPermissionDbInterface.create(
      JSON.stringify(defaultPermission),
      createRole.id,
      outlet.id,
      user.id
    );

    const response = {
      ...createRole.toJSON(),
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
      createRole,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "New Role Created Successfully",
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

//Get All Roles
export const getAllRoles = async (
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
    const outletId = params.id;
    let roleResponse: Role[] = [];

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

    const roleDbInterface = new RoleDbInterface(sequelize);
    const getRoles = await roleDbInterface.getAllRoles(outletId);

    getRoles.map((singleRole) => {
      roleResponse.push({
        id: singleRole.id,
        name: singleRole.name,
        description: singleRole.description,
        isActive: singleRole.isActive,
        outletId: singleRole.outletId,
        updatedBy: singleRole.updatedBy,
        updatedAt: singleRole.updatedAt,
      });
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      getRoles,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getRoles,
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

//Update Role By Id
export const updateRole = async (
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
    const { roleId, outletId } = params;

    const userId = decoded.userDetail.id;
    const role: Role = body;

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

    const roleDbInterface = new RoleDbInterface(sequelize);

    const findRole = await roleDbInterface.getRoleByOutletId(
      roleId,
      outlet.id,
      false
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Role Found",
      uniqueId
    );

    const updatedRole = await roleDbInterface.updateRole(
      role,
      roleId,
      outlet.id,
      userId
    );

    const contentChange = contentChanges(
      findRole.toJSON(),
      updatedRole.toJSON()
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updatedRole,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Role Updated Successfully",
        data: updatedRole,
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

//Delete Role By Id
export const deleteRole = async (
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
    const { roleId, outletId } = params;

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
    const roleDbInterface = new RoleDbInterface(sequelize);
    const deletedRole = await roleDbInterface.deleteRole(
      roleId,
      outlet.id,
      userId
    );

    const outletUserDbInterface = new OutletUserDbInterface(sequelize);

    //delete role in outletUser
    const outletUsers = await outletUserDbInterface.getOutletUserByRoleId(
      roleId
    );

    outletUsers.map(async (outletUser) => {
      //Delete OutletUser
      await outletUser.destroy();
      await outletUser.save();

      //Check User
      await userDeletion(outletUser.userId, uniqueId, sequelize);
    });

    //delete permission
    const userPermissionDbInterface = new UserPermissionDbInterface(sequelize);
    await userPermissionDbInterface.deletePermissionByRoleID(roleId);


    let contentChangesPayload: ContentChangesPayload = {
      name: deletedRole.name ? deletedRole.name : "",
      contentChange: [],
    };

    const contentChange = JSON.stringify(contentChangesPayload);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      roleId,
      deletedRole,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet,
      contentChange
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Role Deleted Successfully",
        data: deletedRole.id,
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
