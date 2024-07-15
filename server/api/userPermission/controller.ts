import { Response, NextFunction } from "express";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Loglevel,
  Actions,
  LogTypes,
  ModuleName,
  ComapnyModule,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import {
  CompanyPermissionDbInterface,
  OutletDbInterface,
  OutletUserDbInterface,
  RoleDbInterface,
  UserDbInterface,
  UserPermissionDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { defaultPermission } from "../../@types/userPermission";
import { contentChanges, getAdminUser } from "../shared";
import { UserPermission } from "../../db/interface";
import { defaultSuperUserCompanyPermission } from "../../@types/user";

const moduleName = "UserPermission";

//Create Permission
export const create = async (
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
    const { outletId, roleId } = params;

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

    const roleDbInterface = new RoleDbInterface(sequelize);
    const role = await roleDbInterface.getRoleById(roleId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Role Found",
      uniqueId
    );

    const permissionPayload: UserPermission = body;

    permissionPayload.roleId = role.id;

    permissionPayload.outletId = outlet.id;

    permissionPayload.permission = JSON.stringify(defaultPermission);

    const userPermissionDbInterface = new UserPermissionDbInterface(sequelize);
    const createPermission = (
      await userPermissionDbInterface.create(
        permissionPayload.permission,
        role.id,
        outlet.id,
        user.id
      )
    ).toJSON();

    const response = {
      ...createPermission,
      permission: JSON.parse(createPermission.permission),
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
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Permission Created Successfully",
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

export const getPermission = async (
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
    const { outletId, roleId } = params;

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

    const roleDbInterface = new RoleDbInterface(sequelize);
    const role = await roleDbInterface.getRoleById(roleId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Role Found",
      uniqueId
    );

    const userPermissionDbInterface = new UserPermissionDbInterface(sequelize);
    const getPermission = (
      await userPermissionDbInterface.getPermissionByRoleId(role.id)
    ).toJSON();

    const response = {
      ...getPermission,
      permission: JSON.parse(getPermission.permission),
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

export const Update = async (
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
    const { outletId, permissionId } = params;

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

    const permissionPayload: UserPermission = body;

    const userPermissionDbInterface = new UserPermissionDbInterface(sequelize);
    const userPermission = await userPermissionDbInterface.getPermissionById(
      permissionId
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Permission Found",
      uniqueId
    );

    permissionPayload.permission = JSON.stringify(permissionPayload.permission);

    const updatedPermission = (
      await userPermissionDbInterface.updatePermission(
        userPermission.id,
        permissionPayload.permission,
        outlet.id,
        user.id
      )
    ).toJSON();

    const contentChange = contentChanges(
      userPermission.toJSON(),
      updatedPermission
    );

    const response = {
      ...updatedPermission,
      permission: JSON.parse(updatedPermission.permission),
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
        message: "Permission Updated Successfully",
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

export const getUserPermission = async (
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
      Actions.GET,
      "Outlet Found",
      uniqueId
    );
    const userPermissionDbInterface = new UserPermissionDbInterface(sequelize);

    let companyPermission = [];
    let getPermission = null;

    if (user.roleId) {
      getPermission = (
        await userPermissionDbInterface.getPermissionByRoleId(user.roleId)
      ).toJSON();

      companyPermission = defaultSuperUserCompanyPermission;
    } else {
      const outletuserDbInterface = new OutletUserDbInterface(sequelize);
      const outletUser =
        await outletuserDbInterface.getOutletUserByOutelIdAndUserId(
          user.id,
          outlet.id
        );

      getPermission = (
        await userPermissionDbInterface.getPermissionByRoleId(outletUser.roleId)
      ).toJSON();

      const companyPermissionDbInterface = new CompanyPermissionDbInterface(
        sequelize
      );

      let checkPermission =
        await companyPermissionDbInterface.getPermissionByUserIdAndCompanyId(
          user.id,
          outlet.companyId
        );

      if (checkPermission) {
        companyPermission = JSON.parse(checkPermission.permission);
      }
    }

    const response = {
      ...getPermission,
      permission: JSON.parse(getPermission.permission),
      CompanyPermission: companyPermission,
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

export const getAllPermission = async (
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
      "getAllPermission",
      params,
      uniqueId
    );

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getAllPermission",
      "User Found",
      uniqueId
    );

    const userPermissionDbInterface = new UserPermissionDbInterface(sequelize);
    const outletuserDbInterface = new OutletUserDbInterface(sequelize);
    const companyPermissionDbInterface = new CompanyPermissionDbInterface(
      sequelize
    );

    let roleIds: number[] = [];

    let permissions: any[] = [];

    let companiesPermission: any[] = [];

    if (!user.roleId) {
      const outletUsers = await outletuserDbInterface.getAllOutletUserByUserId(
        userId
      );

      if (outletUsers.length > 0) {
        outletUsers.map((outletUser) => {
          roleIds.push(outletUser.roleId);
        });
      }

      (
        await companyPermissionDbInterface.getAllPermissionsByUserId(userId)
      ).map((permission) =>
        companiesPermission.push({
          permission: JSON.parse(permission.permission),
          companyId: permission.companyId,
        })
      );
    } else {
      roleIds.push(user.roleId);
      companiesPermission.push({
        permission: defaultSuperUserCompanyPermission,
        companyId: null,
      });
    }

    const OutletPermissions = (
      await userPermissionDbInterface.getAllPermissionByRoleIds(roleIds)
    ).map((permission) => {
      return {
        ...permission.toJSON(),
        permission: JSON.parse(permission.permission),
      };
    });

    //All Outlet Modules
    const outletmodules = Object.values(ModuleName);

    outletmodules.map((moduleName) => {
      let outletPermission: any[] = [];

      OutletPermissions.map((permission) => {
        const findPermission = permission.permission.find(
          (module: any) => module.moduleName === moduleName
        );

        outletPermission.push({
          ...findPermission,
          outletId: permission.outletId,
        });
      });

      permissions.push({
        moduleName,
        outlets: outletPermission,
      });
    });

    //All Company Modules
    const companymodules = Object.values(ComapnyModule);

    companymodules.map((moduleName) => {
      let companyPermission: any[] = [];

      companiesPermission.map((permission) => {
        const findPermission = permission.permission.find(
          (module: any) => module.moduleName === moduleName
        );

        companyPermission.push({
          ...findPermission,
          companyId: permission.companyId,
        });
      });

      permissions.push({
        moduleName,
        companies: companyPermission,
      });
    });

    const response = {
      permissions,
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      "GET AllPermission",
      user,
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
      "GET AllPermission",
      user,
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
