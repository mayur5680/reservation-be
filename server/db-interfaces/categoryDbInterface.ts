import { Sequelize, col, fn } from "sequelize";
import { Category } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { CategoryDbModel, SubCategoryDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class CategoryDbInterface extends BaseInterface<CategoryDbModel> {
  public constructor(sequelize: Sequelize) {
    super(CategoryDbModel, sequelize);
  }

  public create = async (
    category: Category,
    userId: number
  ): Promise<CategoryDbModel> => {
    try {
      const createCategory = await this.repository.create({
        ...category,
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
  ): Promise<CategoryDbModel[]> => {
    try {
      const getAllCategory = await this.repository.findAll({
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
            model: SubCategoryDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        order: [
          ["id", "ASC"],
          ["SubCategory", "id", "ASC"],
        ],
      });
      return getAllCategory;
    } catch (error) {
      throw error;
    }
  };

  public getCategoryById = async (
    id: number,
    checkIsActive = true
  ): Promise<CategoryDbModel> => {
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
          message: Exceptions.INVALID_CATEGORY,
          statusCode: StatusCode.NOTFOUND,
        });
      return category;
    } catch (error) {
      throw error;
    }
  };

  public update = async (
    id: number,
    category: Category,
    userId: number
  ): Promise<CategoryDbModel> => {
    try {
      const updateCategory = await this.repository.update(
        { ...category, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateCategory[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_CATEGORY,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getCategoryById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public delete = async (
    id: number,
    userId: number
  ): Promise<CategoryDbModel> => {
    try {
      const category = await this.getCategoryById(id, false);
      category.updatedBy = userId;
      await category.save();
      await category.destroy();
      return category;
    } catch (error) {
      throw error;
    }
  };
}
