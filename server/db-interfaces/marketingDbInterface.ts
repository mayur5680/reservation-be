import { Sequelize, col, fn } from "sequelize";
import { Marketing } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { MarketingDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class MarketingDbInterface extends BaseInterface<MarketingDbModel> {
  public constructor(sequelize: Sequelize) {
    super(MarketingDbModel, sequelize);
  }

  public create = async (
    marketing: Marketing,
    userId: number
  ): Promise<MarketingDbModel> => {
    try {
      const createMarketing = await this.repository.create({
        ...marketing,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createMarketing)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createMarketing;
    } catch (error) {
      throw error;
    }
  };

  public getAllMarketing = async (): Promise<MarketingDbModel[]> => {
    try {
      const getAllMarketing = await this.repository.findAll({
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
        raw: true,
      });
      return getAllMarketing;
    } catch (error) {
      throw error;
    }
  };

  public getMarketingById = async (
    id: number,
    checkIsActive = true
  ): Promise<MarketingDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const marketing = await this.repository.findOne({
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
      if (!marketing)
        throw new ApiError({
          message: Exceptions.INVALID_MARKETING,
          statusCode: StatusCode.NOTFOUND,
        });
      return marketing;
    } catch (error) {
      throw error;
    }
  };

  public update = async (
    id: number,
    marketing: Marketing,
    userId: number
  ): Promise<MarketingDbModel> => {
    try {
      const updateMarketing = await this.repository.update(
        { ...marketing, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateMarketing[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_MARKETING,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getMarketingById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public delete = async (
    id: number,
    userId: number
  ): Promise<MarketingDbModel> => {
    try {
      const marketing = await this.getMarketingById(id, false);
      marketing.updatedBy = userId;
      await marketing.save();
      await marketing.destroy();
      return marketing;
    } catch (error) {
      throw error;
    }
  };
}
