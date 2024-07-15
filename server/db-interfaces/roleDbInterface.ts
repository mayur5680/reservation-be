import { Op, Sequelize, col, fn } from "sequelize";
import { Role } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { RoleDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { SuperAdmin } from "../config";

export class RoleDbInterface extends BaseInterface<RoleDbModel> {
  public constructor(sequelize: Sequelize) {
    RoleDbModel;
    super(RoleDbModel, sequelize);
  }

  //Create a New Role
  public createRole = async (
    role: Role,
    outletId: Number,
    userId: Number
  ): Promise<RoleDbModel> => {
    try {
      const createRole = await this.repository.create({
        ...role,
        outletId: outletId,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createRole)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createRole;
    } catch (error) {
      throw error;
    }
  };

  //Get All Role
  public getAllRoles = async (id: number): Promise<RoleDbModel[]> => {
    try {
      const getAllRoles = await this.repository.findAll({
        where: {
          outletId: {
            [Op.or]: [id, null],
          },
          id: { [Op.notIn]: [SuperAdmin] },
        },
        attributes: {
          exclude: ["updatedBy"],
          include: [
            [
              fn(
                "concat",
                col("Users.firstName"),
                " ",
                col("Users.lastName"),
                ",",
                col("Users.email")
              ),
              "updatedBy",
            ],
          ],
        },
        include: [
          {
            model: UserDbModel,
            as: "Users",
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        order: ["id"],
      });
      return getAllRoles;
    } catch (error) {
      throw error;
    }
  };

  //Get Role By OutletId
  public getRoleById = async (
    id: number,
    checkIsActive = true
  ): Promise<RoleDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const role = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
      });
      if (!role)
        throw new ApiError({
          message: Exceptions.INVALID_ROLE,
          statusCode: StatusCode.NOTFOUND,
        });
      return role;
    } catch (error) {
      throw error;
    }
  };

  //Get Role By OutletId
  public getRoleByOutletId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<RoleDbModel> => {
    try {
      let query: any = { id, outletId };
      checkIsActive && (query.isActive = true);
      const role = await this.repository.findOne({
        where: query,
        attributes: {
          exclude: ["updatedBy", ...ExcludeAttributes],
          include: [
            [
              fn(
                "concat",
                col("Users.firstName"),
                " ",
                col("Users.lastName"),
                ",",
                col("Users.email")
              ),
              "updatedBy",
            ],
          ],
        },
        include: [
          {
            model: UserDbModel,
            as: "Users",
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      if (!role)
        throw new ApiError({
          message: Exceptions.INVALID_ROLE,
          statusCode: StatusCode.NOTFOUND,
        });
      return role;
    } catch (error) {
      throw error;
    }
  };

  //Update Role
  public updateRole = async (
    role: Role,
    id: number,
    outletId: number,
    userId: number
  ): Promise<RoleDbModel> => {
    try {
      const updateRole = await this.repository.update(
        { ...role, updatedBy: userId },
        {
          where: {
            id,
            outletId,
          },
        }
      );

      if (updateRole[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_ROLE,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getRoleByOutletId(id, outletId, false);
    } catch (error) {
      throw error;
    }
  };

  //Delete Role By Id
  public deleteRole = async (
    id: number,
    outletId: number,
    userId: number
  ): Promise<RoleDbModel> => {
    try {
      const role = await this.getRoleByOutletId(id, outletId, false);
      role.updatedBy = userId;
      await role.save();
      await role.destroy();
      return role;
    } catch (error) {
      throw error;
    }
  };
}
