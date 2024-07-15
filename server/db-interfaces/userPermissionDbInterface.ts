import { Op, Sequelize } from "sequelize";
import { BaseInterface } from "./baseDbInterface";
import { Exceptions } from "../exception";
import { ExcludeAttributes, StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { RoleDbModel, UserPermissionDbModel } from "../db/models";

export class UserPermissionDbInterface extends BaseInterface<UserPermissionDbModel> {
  public constructor(sequelize: Sequelize) {
    super(UserPermissionDbModel, sequelize);
  }

  public create = async (
    permission: string,
    roleId: number,
    outletId: number,
    userId: number
  ): Promise<UserPermissionDbModel> => {
    try {
      const createPermission = await this.repository.create({
        permission,
        roleId,
        outletId,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createPermission)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });

      return createPermission;
    } catch (error) {
      throw error;
    }
  };

  //Get Permisssion By outletId and roleId
  public getPermissionByRoleId = async (
    roleId: number
  ): Promise<UserPermissionDbModel> => {
    try {
      const userPermission = await this.repository.findOne({
        where: {
          roleId,
        },
        include: [
          {
            model: RoleDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });

      if (!userPermission)
        throw new ApiError({
          message: Exceptions.INVALID_PERMISSION,
          statusCode: StatusCode.NOTFOUND,
        });
      return userPermission;
    } catch (error) {
      throw error;
    }
  };

  //Get Permisssion By id
  public getPermissionById = async (
    id: number
  ): Promise<UserPermissionDbModel> => {
    try {
      const userPermission = await this.repository.findOne({
        where: {
          id,
        },
        include: [
          {
            model: RoleDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });

      if (!userPermission)
        throw new ApiError({
          message: Exceptions.INVALID_PERMISSION,
          statusCode: StatusCode.NOTFOUND,
        });
      return userPermission;
    } catch (error) {
      throw error;
    }
  };

  //Update Permission By Id
  public updatePermission = async (
    id: number,
    permission: string,
    outletId: number,
    userId: number
  ): Promise<UserPermissionDbModel> => {
    try {
      const userPermission = await this.repository.update(
        { permission, updatedBy: userId },
        {
          where: {
            id,
            outletId,
          },
        }
      );

      if (userPermission[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_PERMISSION,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getPermissionById(id);
    } catch (error) {
      throw error;
    }
  };

  //Delete Permission By RoleId
  public deletePermissionByRoleID = async (roleId: number): Promise<void> => {
    try {
      await this.repository.destroy({
        where: {
          roleId,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  //Get Permisssion By roleIds
  public getAllPermissionByRoleIds = async (
    roleIds: number[]
  ): Promise<UserPermissionDbModel[]> => {
    try {
      const userPermission = await this.repository.findAll({
        where: {
          roleId: {
            [Op.in]: roleIds,
          },
        },
      });

      return userPermission;
    } catch (error) {
      throw error;
    }
  };
}
