import { Sequelize } from "sequelize";
import { BaseInterface } from "./baseDbInterface";
import { Exceptions } from "../exception";
import { ExcludeAttributes, StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import {
  CompanyDbModel,
  CompanyPermissionDbModel,
  OutletDbModel,
  OutletUserDbModel,
  UserDbModel,
} from "../db/models";

export class CompanyPermissionDbInterface extends BaseInterface<CompanyPermissionDbModel> {
  public constructor(sequelize: Sequelize) {
    super(CompanyPermissionDbModel, sequelize);
  }

  public create = async (
    permission: string,
    userId: number,
    companyId: number,
    createdById: number
  ): Promise<CompanyPermissionDbModel> => {
    try {
      const createPermission = await this.repository.create({
        permission,
        userId,
        companyId,
        createdBy: createdById,
        updatedBy: createdById,
      });
      if (!createPermission)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });

      return this.getCompanyPermissionById(createPermission.id);
    } catch (error) {
      throw error;
    }
  };

  //Get Permisssion By companyId and userId
  public getPermissionByUserIdAndCompanyId = async (
    userId: number,
    companyId: number
  ): Promise<CompanyPermissionDbModel | null> => {
    try {
      const userPermission = await this.repository.findOne({
        where: {
          userId,
          companyId,
        },
        include: [
          {
            model: UserDbModel,
            as: "Users",
            where: { isActive: true },
            required: true,
            attributes: [],
          },
          {
            model: CompanyDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return userPermission;
    } catch (error) {
      throw error;
    }
  };

  public getCompanyPermissionById = async (
    id: number,
    checkIsActive = true
  ): Promise<CompanyPermissionDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const permission = await this.repository.findOne({
        where: query,
        include: [
          {
            model: UserDbModel,
            as: "Users",
            required: true,
            attributes: [],
          },
          {
            model: CompanyDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!permission)
        throw new ApiError({
          message: Exceptions.INVALID_COMPANY_PERMISSION,
          statusCode: StatusCode.NOTFOUND,
        });
      return permission;
    } catch (error) {
      throw error;
    }
  };

  public getAllPermissionsByComapnyId = async (
    companyId: number
  ): Promise<CompanyPermissionDbModel[]> => {
    try {
      const userPermission = await this.repository.findAll({
        where: {
          companyId,
        },
        include: [
          {
            model: UserDbModel,
            as: "Users",
            where: { isActive: true },
            required: true,
            attributes: [],
          },
          {
            model: CompanyDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
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
    userId: number
  ): Promise<CompanyPermissionDbModel> => {
    try {
      const companyPermission = await this.repository.update(
        { permission, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (companyPermission[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_COMPANY_PERMISSION,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getCompanyPermissionById(id);
    } catch (error) {
      throw error;
    }
  };

  public getAllPermissionsByUserId = async (
    userId: number
  ): Promise<CompanyPermissionDbModel[]> => {
    try {
      const userPermission = await this.repository.findAll({
        where: {
          userId,
        },
        include: [
          {
            model: UserDbModel,
            as: "Users",
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: CompanyDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: OutletUserDbModel,
                    where: { userId, isActive: true },
                    required: true,
                    attributes: { exclude: ExcludeAttributes },
                  },
                ],
              },
            ],
          },
        ],
      });

      return userPermission;
    } catch (error) {
      throw error;
    }
  };
}
