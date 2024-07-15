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
  UserDbInterface,
  OutletUserDbInterface,
  RoleDbInterface,
  OutletDbInterface,
  CompanyPermissionDbInterface,
  CompanyDbInterface,
} from "../../db-interfaces";
import {
  CreateUserPayload,
  UpdateUserPayload,
  CreateSuperAdminPayload,
  defaultCompanyPermission,
} from "../../@types/user";
import { ApiError } from "../../@types/apiError";
import { ApiResponse } from "../../@types/apiSuccess";
import { Exceptions } from "../../exception";
import { getGuid } from "../../context/service";
import { Log } from "../../context/Logs";
import { getAdminUser, getUpdateBy, userDeletion } from "../shared";

const moduleName = "User";

//Creat New User
export const createUser = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, body, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

    const userBody: CreateUserPayload = body;

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
    outlet = await outletDbInterface.getOutletbyId(userBody.outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Outlet Found",
      uniqueId
    );

    const roleDbInterface = new RoleDbInterface(sequelize);
    const role = await roleDbInterface.getRoleById(userBody.roleId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Role Found",
      uniqueId
    );

    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const userOutletDbInterface = new OutletUserDbInterface(sequelize);

    const createdUser = (
      await userDbInterface.createUser(
        userBody,
        userOutletDbInterface,
        outlet,
        userId,
        uniqueId
      )
    ).toJSON();

    createdUser.isActive = true;
    delete createdUser.password;

    //check Company Permission
    const companyPermissionDbInterface = new CompanyPermissionDbInterface(
      sequelize
    );

    let checkPermission =
      await companyPermissionDbInterface.getPermissionByUserIdAndCompanyId(
        createdUser.id,
        outlet.companyId
      );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      checkPermission,
      uniqueId
    );

    if (checkPermission) {
      checkPermission.permission = JSON.stringify(userBody.permission);
      await checkPermission.save();
    } else {
      checkPermission = await companyPermissionDbInterface.create(
        JSON.stringify(userBody.permission),
        createdUser.id,
        outlet.companyId,
        user.id
      );
    }

    let companyPermission = {
      ...checkPermission.toJSON(),
      permission: checkPermission?.permission
        ? JSON.parse(checkPermission.permission)
        : [],
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      createdUser,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "New User Created Successfully",
        data: {
          ...createdUser,
          updatedBy: getUpdateBy(user),
          Role: role,
          CompanyPermission: companyPermission,
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

export const getUsers = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet: any = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);

    const users: any = [];

    const userId = decoded.userDetail.id;
    const outletId = params.outletid;

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

    const companyPermissionDbInterface = new CompanyPermissionDbInterface(
      sequelize
    );

    //find All Company's Permision by companyId

    const permissions = (
      await companyPermissionDbInterface.getAllPermissionsByComapnyId(
        outlet.companyId
      )
    ).map((permission) => {
      return {
        ...permission.toJSON(),
        permission: JSON.parse(permission.permission),
      };
    });

    const outletuserDbInterface = new OutletUserDbInterface(sequelize);
    const outletUser = await outletuserDbInterface.getOutletUserByOutelId(
      outlet.id
    );

    await Promise.all(
      outletUser.map(async (outletUser) => {
        if (outletUser.User) {
          let companyPermission = permissions.find(
            (permission) => permission.userId === outletUser.userId
          );
          if (!companyPermission) {
            companyPermission = await companyPermissionDbInterface.create(
              JSON.stringify(defaultCompanyPermission),
              outletUser.userId,
              outlet.companyId,
              user.id
            );
            companyPermission = {
              ...companyPermission.toJSON(),
              permission: JSON.parse(companyPermission.permission),
            };
          }

          users.push({
            ...outletUser.User.toJSON(),
            isActive: outletUser.isActive,
            Role: outletUser.Role,
            CompanyPermission: companyPermission ? companyPermission : null,
          });
        }
      })
    );
    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      users,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: users,
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

export const getUsersByCompanyId = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);

    const userId = decoded.userDetail.id;
    const companyId = params.companyId;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "User Found",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const company = await companyDbInterface.getComapnyById(companyId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Company Found",
      uniqueId
    );

    const outletUser = await userDbInterface.getUserOutLetsByCompanyId(
      company.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      outletUser,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: outletUser,
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

export const updateUser = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, body, params, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.UPDATED, body, uniqueId);

    const { userId, outletId } = params;

    const userID = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);

    const userBody: UpdateUserPayload = body;
    const roleId = userBody.roleId;
    const isActive = userBody.isActive;
    const CompanyPermissionPayload = userBody.companyPermission;
    delete userBody.isActive;
    delete userBody.roleId;
    delete userBody.companyPermission;

    const outletDbInterface = new OutletDbInterface(sequelize);
    outlet = await outletDbInterface.getOutletbyId(outletId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Outlet Found",
      uniqueId
    );

    const roleDbInterface = new RoleDbInterface(sequelize);
    const role = await roleDbInterface.getRoleById(roleId as number);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Role Found",
      uniqueId
    );
    const outletUserDbInterface = new OutletUserDbInterface(sequelize);

    const user = await userDbInterface.checkUserById(userId);

    if (user.userName === userBody.email) {
      delete userBody.email;
      delete userBody.userName;
    }

    if (userBody.email) {
      const user = await userDbInterface.getUserOutLetsByUserName(
        userBody.email
      );
      if (user) {
        throw new ApiError({
          message: Exceptions.USERNAME_ALREADY_EXISTS,
          statusCode: StatusCode.BAD_REQUEST,
        });
      }
      userBody.userName = userBody.email;
    }

    const companyPermissionDbInterface = new CompanyPermissionDbInterface(
      sequelize
    );

    //find Company Permission
    const companyPermission =
      await companyPermissionDbInterface.getCompanyPermissionById(
        CompanyPermissionPayload?.id as number
      );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Permission Found",
      uniqueId
    );

    let updatedUser = await userDbInterface.upadteUser(
      userId,
      userBody,
      outletId,
      roleId as number,
      isActive as boolean,
      outletUserDbInterface,
      userID
    );

    updatedUser = updatedUser.toJSON();

    const outletUser = updatedUser.OutletUser?.find(
      (outletUser) => outletUser.outletId === Number(outletId)
    );

    updatedUser.isActive = outletUser!?.isActive;
    const userRole = outletUser?.Role;
    delete updatedUser.OutletUser;

    //Update companyPermission

    const permission = JSON.stringify(CompanyPermissionPayload?.permission);
    let updatedPermission = (
      await companyPermissionDbInterface.updatePermission(
        companyPermission.id,
        permission,
        userID
      )
    ).toJSON();

    updatedPermission = {
      ...updatedPermission,
      permission: JSON.parse(updatedPermission.permission),
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updatedUser,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "User Updated Successfully",
        data: {
          ...updatedUser,
          Role: userRole,
          CompanyPermission: updatedPermission,
        },
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

export const deleteUser = async (
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

    const userid = decoded.userDetail.id;
    const { userId, outletId } = params;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userid);
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

    //Check wheather LoggedIn User Has Access to Delete a User
    if (!user.roleId) {
      await userDbInterface.getUserByUserIdAndOutletId(user.id, outlet.id);
    }

    const outletuserDbInterface = new OutletUserDbInterface(sequelize);
    const deletedUser = await userDbInterface.deleteUser(
      userId,
      outletId,
      outletuserDbInterface
    );

    //check if user is access of another outlet
    await userDeletion(userId, uniqueId, sequelize);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      userId,
      deletedUser,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "User Deleted Successfully",
        data: deletedUser,
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

export const createSupeAdmin = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, body, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, "SuperAdmin", Actions.CREATED, body, uniqueId);

    const createSuperAdminPayload: CreateSuperAdminPayload = body;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      "SuperAdmin",
      Actions.CREATED,
      "User Found",
      uniqueId
    );

    if (!user.roleId) {
      throw new ApiError({
        message: Exceptions.UNAUTHORIZED_ACCESS,
        statusCode: StatusCode.UNAUTHORIZED,
      });
    }

    const userOutletDbInterface = new OutletUserDbInterface(sequelize);

    const superAdmin = (
      await userDbInterface.createSuperAdmin(
        createSuperAdminPayload,
        userOutletDbInterface,
        user.id,
        uniqueId
      )
    ).toJSON();

    delete superAdmin.OutletUser;

    Log.writeExitLog(
      Loglevel.INFO,
      "SuperAdmin",
      Actions.CREATED,
      body,
      superAdmin,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "New SuperAdmin Created Successfully",
        data: { ...superAdmin, updatedBy: getUpdateBy(user) },
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "SuperAdmin",
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

export const getAllSuperUser = async (
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
    Log.writeLog(Loglevel.INFO, "SuperAdmin", Actions.GET, decoded, uniqueId);

    const userid = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userid);
    Log.writeLog(
      Loglevel.INFO,
      "SuperAdmin",
      Actions.GET,
      "User Found",
      uniqueId
    );

    if (!user.roleId) {
      throw new ApiError({
        message: Exceptions.UNAUTHORIZED_ACCESS,
        statusCode: StatusCode.UNAUTHORIZED,
      });
    }
    const superUsers = await userDbInterface.getAllSuperAdmin();

    Log.writeExitLog(
      Loglevel.INFO,
      "SuperAdmin",
      Actions.GET,
      decoded,
      superUsers,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: superUsers,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "SuperAdmin",
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

export const updateSupeAdmin = async (
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
    Log.writeLog(Loglevel.INFO, "SuperAdmin", Actions.UPDATED, body, uniqueId);

    const superUserId = params.id;

    const userId = decoded.userDetail.id;

    const userBody: UpdateUserPayload = body;
    delete userBody.roleId;
    const userDbInterface = new UserDbInterface(sequelize);

    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      "SuperAdmin",
      Actions.UPDATED,
      "User Found",
      uniqueId
    );

    if (!user.roleId) {
      throw new ApiError({
        message: Exceptions.UNAUTHORIZED_ACCESS,
        statusCode: StatusCode.UNAUTHORIZED,
      });
    }

    const superUser = await userDbInterface.checkUserById(superUserId, false);

    if (superUser.userName === userBody.email) {
      delete userBody.email;
      delete userBody.userName;
    }

    if (userBody.email) {
      const user = await userDbInterface.getUserOutLetsByUserName(
        userBody.email
      );
      if (user) {
        throw new ApiError({
          message: Exceptions.USERNAME_ALREADY_EXISTS,
          statusCode: StatusCode.BAD_REQUEST,
        });
      }
      userBody.userName = userBody.email;
    }

    const superAdmin = (
      await userDbInterface.updateUserById(superUserId, userBody, userId)
    ).toJSON();

    delete superAdmin.OutletUser;

    Log.writeExitLog(
      Loglevel.INFO,
      "SuperAdmin",
      Actions.UPDATED,
      body,
      superAdmin,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "SuperAdmin Updated Successfully",
        data: superAdmin,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "SuperAdmin",
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

export const deleteSuperAdmin = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      "SuperAdmin",
      Actions.DELETED,
      params,
      uniqueId
    );

    const userId = decoded.userDetail.id;
    const userIdParams = params.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      "SuperAdmin",
      Actions.DELETED,
      "User Found",
      uniqueId
    );

    if (!user.roleId) {
      throw new ApiError({
        message: Exceptions.UNAUTHORIZED_ACCESS,
        statusCode: StatusCode.UNAUTHORIZED,
      });
    }
    const deletedUser = await userDbInterface.deleteSuperAdmin(
      userIdParams,
      user.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      "SuperAdmin",
      Actions.DELETED,
      userIdParams,
      deletedUser,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Super Admin Deleted Successfully",
        data: deletedUser.id,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      "SuperAdmin",
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
