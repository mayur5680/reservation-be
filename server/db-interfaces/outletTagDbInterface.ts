import { Sequelize } from "sequelize";
import { OutletTag } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { OutletTagDbModel, TagDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class OutletTagDbInterface extends BaseInterface<OutletTagDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletTagDbModel, sequelize);
  }

  public create = async (
    outletTag: OutletTag,
    userId: Number
  ): Promise<OutletTagDbModel> => {
    try {
      const createOutletTag = await this.repository.create({
        ...outletTag,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createOutletTag)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createOutletTag;
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletTag = async (id: number): Promise<OutletTagDbModel[]> => {
    try {
      const getAllOutletTag = await this.repository.findAll({
        where: {
          outletId: id,
        },
        include: [
          {
            model: TagDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: ["id"],
      });
      return getAllOutletTag;
    } catch (error) {
      throw error;
    }
  };

  public getOutlettagById = async (
    id: number,
    checkIsActive = true
  ): Promise<OutletTagDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const tag = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: TagDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!tag)
        throw new ApiError({
          message: Exceptions.INVALID_TAG,
          statusCode: StatusCode.NOTFOUND,
        });
      return tag;
    } catch (error) {
      throw error;
    }
  };

  public update = async (
    id: number,
    outletTag: OutletTag,
    userId: Number
  ): Promise<OutletTagDbModel> => {
    try {
      const updateOutletTag = await this.repository.update(
        { ...outletTag, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );
      if (!updateOutletTag)
        throw new ApiError({
          message: Exceptions.INVALID_TAG,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return this.getOutlettagById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public delete = async (
    id: number,
    userId: number
  ): Promise<OutletTagDbModel> => {
    try {
      const tag = await this.getOutlettagById(id, false);
      await tag.destroy({ force: true });
      return tag;
    } catch (error) {
      throw error;
    }
  };
}
