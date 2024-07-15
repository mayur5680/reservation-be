import { Op, Sequelize, col, fn } from "sequelize";
import { Tag } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { TagCategoryDbModel, TagDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class TagDbInterface extends BaseInterface<TagDbModel> {
  public constructor(sequelize: Sequelize) {
    super(TagDbModel, sequelize);
  }

  public create = async (tag: Tag, userId: number): Promise<TagDbModel> => {
    try {
      const createTag = await this.repository.create({
        ...tag,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createTag)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createTag;
    } catch (error) {
      throw error;
    }
  };

  public getAllTags = async (outletId: number): Promise<TagDbModel[]> => {
    try {
      const getAllTags = await this.repository.findAll({
        where: {
          outletId: {
            [Op.or]: [outletId, null],
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
            model: TagCategoryDbModel,
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
        order: ["tagCategoryId"],
      });
      return getAllTags;
    } catch (error) {
      throw error;
    }
  };

  public getAllTagsByCategoryId = async (
    tagCategoryId: number
  ): Promise<TagDbModel[]> => {
    try {
      const getAllTags = await this.repository.findAll({
        where: {
          tagCategoryId,
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
            model: TagCategoryDbModel,
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
      return getAllTags;
    } catch (error) {
      throw error;
    }
  };

  public getAllTagsByCategoryIdandOutletIds = async (
    tagCategoryId: number | null,
    outletIds: number[]
  ): Promise<TagDbModel[]> => {
    try {
      const query: any = {
        outletId: {
          [Op.or]: [outletIds, null],
        },
      };

      if (tagCategoryId) {
        query.tagCategoryId = tagCategoryId;
      }

      const getAllTags = await this.repository.findAll({
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
            model: TagCategoryDbModel,
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
      return getAllTags;
    } catch (error) {
      throw error;
    }
  };

  public getTagById = async (
    id: number,
    checkIsActive = true
  ): Promise<TagDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const tag = await this.repository.findOne({
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
            model: TagCategoryDbModel,
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

  public getTagByIdByOutletId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<TagDbModel> => {
    try {
      let query: any = { id, outletId };
      checkIsActive && (query.isActive = true);
      const tag = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: TagCategoryDbModel,
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

  public updateTag = async (
    tag: Tag,
    id: number,
    outletId: number,
    userId: number
  ): Promise<TagDbModel> => {
    try {
      const updateTag = await this.repository.update(
        { ...tag, updatedBy: userId },
        {
          where: {
            id,
            outletId,
          },
        }
      );

      if (updateTag[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_TAG,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getTagById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteTag = async (
    id: number,
    outletId: number,
    userId: number
  ): Promise<TagDbModel> => {
    try {
      const tag = await this.getTagByIdByOutletId(id, outletId, false);
      tag.updatedBy = userId;
      await tag.save();
      await tag.destroy();
      return tag;
    } catch (error) {
      throw error;
    }
  };
}
