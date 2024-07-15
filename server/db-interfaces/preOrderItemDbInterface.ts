import { Op, Sequelize, col, fn } from "sequelize";
import { ExcludeAttributes } from "../context";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { PreOrderItemRequestPayload } from "../@types/preOrderItem";
import { PreOrderItem } from "../db/interface";
import {
  OutletDbModel,
  PreOrderItemDbModel,
  SectionDbModel,
  UserDbModel,
} from "../db/models";

export class PreOrderItemDbInterface extends BaseInterface<PreOrderItemDbModel> {
  public constructor(sequelize: Sequelize) {
    super(PreOrderItemDbModel, sequelize);
  }

  public create = async (
    preOrderItem: PreOrderItemRequestPayload,
    sectionIds: number[],
    userId: number
  ): Promise<PreOrderItemDbModel[]> => {
    try {
      const ids = await Promise.all(
        sectionIds.map(async (sectionId) => {
          const createPreOrderItem = await this.repository.create({
            ...preOrderItem,
            sectionId,
            createdBy: userId,
            updatedBy: userId,
          });
          return createPreOrderItem.id;
        })
      );
      return await this.getAllPreOrderItemById(ids);
    } catch (error) {
      throw error;
    }
  };

  public getAllPreOrderItemById = async (
    ids: number[]
  ): Promise<PreOrderItemDbModel[]> => {
    try {
      const preOrderItem = await this.repository.findAll({
        where: {
          id: {
            [Op.in]: ids,
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
            model: SectionDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      return preOrderItem;
    } catch (error) {
      throw error;
    }
  };

  public getAllPreOrderItemByOutletId = async (
    outletId: number
  ): Promise<PreOrderItemDbModel[]> => {
    try {
      const preOrderItem = await this.repository.findAll({
        where: {
          outletId,
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
            model: SectionDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      return preOrderItem;
    } catch (error) {
      throw error;
    }
  };

  public getPreOrderItemById = async (
    id: number,
    checkIsActive = true
  ): Promise<PreOrderItemDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const preOrderItem = await this.repository.findOne({
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
            model: SectionDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      if (!preOrderItem)
        throw new ApiError({
          message: Exceptions.INVALID_ITEM,
          statusCode: StatusCode.NOTFOUND,
        });
      return preOrderItem;
    } catch (error) {
      throw error;
    }
  };

  public updatePreOrderItem = async (
    id: number,
    preOrderItem: PreOrderItem,
    userId: number
  ): Promise<PreOrderItemDbModel> => {
    try {
      const updatePreOrderItem = await this.repository.update(
        { ...preOrderItem, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updatePreOrderItem[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_ITEM,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getPreOrderItemById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public deletePreOrderItem = async (
    id: number,
    userId: number
  ): Promise<PreOrderItemDbModel> => {
    try {
      const preOrderItem = await this.getPreOrderItemById(id, false);
      preOrderItem.updatedBy = userId;
      await preOrderItem.save();
      await preOrderItem.destroy();
      return preOrderItem;
    } catch (error) {
      throw error;
    }
  };

  public getAllPreOrderItemByCompanyId = async (
    companyIds: number[]
  ): Promise<PreOrderItemDbModel[]> => {
    try {
      const getAllItem = await this.repository.findAll({
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
      return getAllItem;
    } catch (error) {
      throw error;
    }
  };
}
