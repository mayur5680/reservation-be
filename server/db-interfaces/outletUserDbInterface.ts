import { Sequelize, col, fn } from "sequelize";
import { OutletUser } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  CompanyDbModel,
  OutletDbModel,
  OutletUserDbModel,
  RoleDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class OutletUserDbInterface extends BaseInterface<OutletUserDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletUserDbModel, sequelize);
  }

  public create = async (
    outletUser: OutletUser
  ): Promise<OutletUserDbModel> => {
    try {
      const createOutletUser = await this.repository.create({ ...outletUser });
      if (!createOutletUser)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createOutletUser;
    } catch (error) {
      throw error;
    }
  };

  public delete = async (userId: number, outltId: number): Promise<void> => {
    try {
      const deleteOutletUser = await this.repository.destroy({
        where: {
          userId: userId,
          outletId: outltId,
        },
      });
      if (deleteOutletUser === 0)
        throw new ApiError({
          message: Exceptions.INVALID_USER,
          statusCode: StatusCode.NOTFOUND,
        });
    } catch (error) {
      throw error;
    }
  };

  public deleteByUserId = async (userId: number): Promise<void> => {
    try {
      const deleteOutletUser = await this.repository.destroy({
        where: {
          userId: userId,
        },
      });
      if (deleteOutletUser === 0)
        throw new ApiError({
          message: Exceptions.INVALID_OUTLET,
          statusCode: StatusCode.NOTFOUND,
        });
    } catch (error) {
      throw error;
    }
  };

  public deleteByRoleId = async (roleId: number): Promise<void> => {
    try {
      const deleteOutletUser = await this.repository.destroy({
        where: {
          roleId,
        },
      });
      if (deleteOutletUser === 0)
        throw new ApiError({
          message: Exceptions.INVALID_ROLE,
          statusCode: StatusCode.NOTFOUND,
        });
    } catch (error) {
      throw error;
    }
  };

  public getOutletUserByOutelId = async (
    outletId: number
  ): Promise<OutletUserDbModel[]> => {
    try {
      const getOutletUsers = await this.repository.findAll({
        where: {
          outletId,
        },
        order: ["userId"],
        include: [
          {
            model: UserDbModel,
            attributes: {
              exclude: ["updatedBy", ...ExcludeAttributes],
              include: [
                [
                  fn(
                    "concat",
                    col("User.firstName"),
                    " ",
                    col("User.lastName"),
                    ",",
                    col("User.email")
                  ),
                  "updatedBy",
                ],
              ],
            },
            required: true,
            include: [
              {
                model: UserDbModel,
                attributes: [],
                required: true,
              },
            ],
          },
          {
            model: RoleDbModel,
            attributes: { exclude: ExcludeAttributes },
            required: true,
          },
        ],
      });
      return getOutletUsers;
    } catch (error) {
      throw error;
    }
  };

  public updateUserRole = async (
    userId: number,
    outletId: number,
    roleId: number,
    isActive: boolean
  ): Promise<void> => {
    try {
      const updateOutletUser = await this.repository.update(
        { roleId, isActive },
        {
          where: {
            userId,
            outletId,
          },
        }
      );
      if (updateOutletUser[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_USER,
          statusCode: StatusCode.NOTFOUND,
        });
    } catch (error) {
      throw error;
    }
  };

  public getOutletUserByOutelIdAndUserId = async (
    userId: number,
    outletId: number
  ): Promise<OutletUserDbModel> => {
    try {
      const getOutletUsers = await this.repository.findOne({
        where: {
          outletId,
          userId,
        },
        include: [
          {
            model: UserDbModel,
            attributes: { exclude: ExcludeAttributes },
            required: true,
          },
          {
            model: RoleDbModel,
            attributes: { exclude: ExcludeAttributes },
            required: true,
          },
          {
            model: OutletDbModel,
            attributes: { exclude: ExcludeAttributes },
            required: true,
          },
        ],
      });

      if (!getOutletUsers)
        throw new ApiError({
          message: Exceptions.INVALID_USER,
          statusCode: StatusCode.UNAUTHORIZED,
        });
      return getOutletUsers;
    } catch (error) {
      throw error;
    }
  };

  public getOutletUserByUserId = async (
    userId: number
  ): Promise<OutletUserDbModel | null> => {
    try {
      const getOutletUsers = await this.repository.findOne({
        where: {
          userId,
        },
      });
      return getOutletUsers;
    } catch (error) {
      throw error;
    }
  };

  public getOutletUserByRoleId = async (
    roleId: number
  ): Promise<OutletUserDbModel[]> => {
    try {
      const getOutletUsers = await this.repository.findAll({
        where: {
          roleId,
        },
      });
      return getOutletUsers;
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletUserByUserId = async (
    userId: number
  ): Promise<OutletUserDbModel[]> => {
    try {
      const getOutletUsers = await this.repository.findAll({
        where: {
          userId,
        },
        attributes: ["roleId"],
        include: [
          {
            model: RoleDbModel,
            where: { isActive: true },
            attributes: ["id"],
            required: true,
          },
          {
            model: OutletDbModel,
            where: { isActive: true },
            attributes: { exclude: ExcludeAttributes },
            required: true,
            include: [
              {
                model: CompanyDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
      });
      return getOutletUsers;
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletByUserId = async (
    userId: number
  ): Promise<OutletUserDbModel[]> => {
    try {
      const getOutletUsers = await this.repository.findAll({
        where: {
          userId,
        },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: RoleDbModel,
            where: { isActive: true },
            attributes: ["id"],
            required: true,
          },
          {
            model: OutletDbModel,
            where: { isActive: true },
            attributes: { exclude: ExcludeAttributes },
            required: true,
            include: [
              {
                model: CompanyDbModel,
                required: true,
                where: { isActive: true },
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
      });
      return getOutletUsers;
    } catch (error) {
      throw error;
    }
  };
}
