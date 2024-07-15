import { Sequelize, col, fn } from "sequelize";
import { AutoTagging } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  AutoTaggingDbModel,
  TagCategoryDbModel,
  TagDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class AutoTaggingDbInterface extends BaseInterface<AutoTaggingDbModel> {
  public constructor(sequelize: Sequelize) {
    super(AutoTaggingDbModel, sequelize);
  }

  public create = async (
    autoTagging: AutoTagging,
    userId: number
  ): Promise<AutoTaggingDbModel> => {
    try {
      const createAutoTag = await this.repository.create({
        ...autoTagging,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createAutoTag)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createAutoTag;
    } catch (error) {
      throw error;
    }
  };

  public getAllAutoTags = async (
    outletId: number
  ): Promise<AutoTaggingDbModel[]> => {
    try {
      const autoTagged = await this.repository.findAll({
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
            model: UserDbModel,
            required: true,
            attributes: [],
          },
          {
            model: TagDbModel,
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: TagCategoryDbModel,
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
      });
      return autoTagged;
    } catch (error) {
      throw error;
    }
  };

  public getAutoTagById = async (
    id: number,
    checkIsActive = true
  ): Promise<AutoTaggingDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const autotag = await this.repository.findOne({
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
            model: TagDbModel,
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: TagCategoryDbModel,
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      if (!autotag)
        throw new ApiError({
          message: Exceptions.INVALID_AUTOTAG,
          statusCode: StatusCode.NOTFOUND,
        });
      return autotag;
    } catch (error) {
      throw error;
    }
  };

  public getAutoTagByTagIdAndOutletId = async (
    outletId: number,
    tagId: number
  ): Promise<Boolean> => {
    try {
      const autotag = await this.repository.findOne({
        where: {
          tagId,
          outletId,
        },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: TagDbModel,
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: TagCategoryDbModel,
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
      });
      if (autotag) {
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  };

  public update = async (
    id: number,
    autoTagging: AutoTagging,
    userId: number
  ): Promise<AutoTaggingDbModel> => {
    try {
      const updateAutoTag = await this.repository.update(
        { ...autoTagging, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateAutoTag[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_AUTOTAG,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getAutoTagById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public delete = async (
    id: number,
    userId: number
  ): Promise<AutoTaggingDbModel> => {
    try {
      const autoTag = await this.getAutoTagById(id, false);
      autoTag.updatedBy = userId;
      await autoTag.save();
      await autoTag.destroy();
      return autoTag;
    } catch (error) {
      throw error;
    }
  };

  public deleteByTagId = async (tagId: number): Promise<void> => {
    try {
      await this.repository.destroy({
        where: {
          tagId,
        },
      });
    } catch (error) {
      throw error;
    }
  };
}
