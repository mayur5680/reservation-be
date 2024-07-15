import { Op, Sequelize, col, fn } from "sequelize";
import { TagCategory } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { TagCategoryDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class TagCategoryDbInterface extends BaseInterface<TagCategoryDbModel> {
  public constructor(sequelize: Sequelize) {
    super(TagCategoryDbModel, sequelize);
  }

  public create = async (
    tagCategory: TagCategory,
    userId: number
  ): Promise<TagCategoryDbModel> => {
    try {
      const createCategory = await this.repository.create({
        ...tagCategory,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createCategory)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createCategory;
    } catch (error) {
      throw error;
    }
  };

  public getAllCategory = async (
    outletId: number
  ): Promise<TagCategoryDbModel[]> => {
    try {
      const getAllCategory = await this.repository.findAll({
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
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        order: ["id"],
      });
      return getAllCategory;
    } catch (error) {
      throw error;
    }
  };

  public getTagCategoryById = async (
    id: number,
    checkIsActive = true
  ): Promise<TagCategoryDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const category = await this.repository.findOne({
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
      if (!category)
        throw new ApiError({
          message: Exceptions.INVALID_TAGCATEGORY,
          statusCode: StatusCode.NOTFOUND,
        });
      return category;
    } catch (error) {
      throw error;
    }
  };

  //get category by id and outletId
  public getTagCategoryByIdAndOutletId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<TagCategoryDbModel> => {
    try {
      let query: any = { id, outletId };
      checkIsActive && (query.isActive = true);
      const category = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
      });
      if (!category)
        throw new ApiError({
          message: Exceptions.INVALID_TAGCATEGORY,
          statusCode: StatusCode.NOTFOUND,
        });
      return category;
    } catch (error) {
      throw error;
    }
  };

  public update = async (
    id: number,
    tagCategory: TagCategory,
    outletId: number,
    userId: number
  ): Promise<TagCategoryDbModel> => {
    try {
      const updateCategory = await this.repository.update(
        { ...tagCategory, updatedBy: userId },
        {
          where: {
            id,
            outletId,
          },
        }
      );

      if (updateCategory[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_TAGCATEGORY,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getTagCategoryById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public delete = async (
    id: number,
    outletId: number,
    userId: number
  ): Promise<TagCategoryDbModel> => {
    try {
      const category = await this.getTagCategoryByIdAndOutletId(
        id,
        outletId,
        false
      );
      category.updatedBy = userId;
      await category.save();
      await category.destroy();
      return category;
    } catch (error) {
      throw error;
    }
  };
}
