import { Op, Sequelize, col, fn } from "sequelize";
import { DiningOption } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { DiningOptionDbModel, OutletDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class DiningOptionDbInterface extends BaseInterface<DiningOptionDbModel> {
  public constructor(sequelize: Sequelize) {
    super(DiningOptionDbModel, sequelize);
  }

  public create = async (
    diningOption: DiningOption,
    userId: number
  ): Promise<DiningOptionDbModel> => {
    try {
      const createDiningOption = await this.repository.create({
        ...diningOption,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createDiningOption)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createDiningOption;
    } catch (error) {
      throw error;
    }
  };

  public getAllDiningOption = async (
    query: any
  ): Promise<DiningOptionDbModel[]> => {
    try {
      const getAllDiningOption = await this.repository.findAll({
        where: query,
        attributes: {
          exclude: ["updatedBy"],
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
        include: [
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        order: ["id"],
      });
      return getAllDiningOption;
    } catch (error) {
      throw error;
    }
  };

  public getDiningOptionById = async (
    id: number,
    checkIsActive = true
  ): Promise<DiningOptionDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const section = await this.repository.findOne({
        where: query,
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
        include: [
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      if (!section)
        throw new ApiError({
          message: Exceptions.INVALID_DINING_OPTION,
          statusCode: StatusCode.NOTFOUND,
        });
      return section;
    } catch (error) {
      throw error;
    }
  };

  public updateDiningOption = async (
    id: number,
    diningOption: DiningOption,
    userId: number
  ): Promise<DiningOptionDbModel> => {
    try {
      const updateDiningOption = await this.repository.update(
        { ...diningOption, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateDiningOption[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_DINING_OPTION,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getDiningOptionById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteDiningOption = async (
    id: number,
    userId: number
  ): Promise<DiningOptionDbModel> => {
    try {
      const diningOption = await this.getDiningOptionById(id, false);
      diningOption.updatedBy = userId;
      await diningOption.save();
      await diningOption.destroy();
      return diningOption;
    } catch (error) {
      throw error;
    }
  };

  public getAllDiningOptionByIds = async (
    ids: number[]
  ): Promise<DiningOptionDbModel[]> => {
    try {
      const getAllDiningOption = await this.repository.findAll({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      });
      return getAllDiningOption;
    } catch (error) {
      throw error;
    }
  };

  public getAllDiningOptionsByCompanyId = async (
    companyIds: number[]
  ): Promise<DiningOptionDbModel[]> => {
    try {
      const getAllDiningOption = await this.repository.findAll({
        where: {
          isActive: true,
        },
        include: [
          {
            model: OutletDbModel,
            where: {
              companyId: {
                [Op.in]: companyIds,
              },
              isActive: true,
            },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: ["id"],
      });
      return getAllDiningOption;
    } catch (error) {
      throw error;
    }
  };

  public getAllDiningOptionForBooking = async (
    outletId: number,
    weekName:string
  ): Promise<DiningOptionDbModel[]> => {
    try {
      const getAllDiningOption = await this.repository.findAll({
        where: {
          outletId,
          isActive: true,
          repeatOn: {
            [Op.like]: `%${weekName}%`,
          },
        },
        attributes: {
          exclude: ["updatedBy"],
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
        include: [
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        order: ["id"],
      });
      return getAllDiningOption;
    } catch (error) {
      throw error;
    }
  };
}
