import { Sequelize, col, fn } from "sequelize";
import { SubCategory } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { CategoryDbModel, SubCategoryDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class SubCategoryDbInterface extends BaseInterface<SubCategoryDbModel> {
  public constructor(sequelize: Sequelize) {
    super(SubCategoryDbModel, sequelize);
  }

  public create = async (
    subCategory: SubCategory,
    userId: number
  ): Promise<SubCategoryDbModel> => {
    try {
      const createSubCategory = await this.repository.create({
        ...subCategory,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createSubCategory)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createSubCategory;
    } catch (error) {
      throw error;
    }
  };

  public getAllSubCategory = async (): Promise<SubCategoryDbModel[]> => {
    try {
      const subCategories = await this.repository.findAll({
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
            model: CategoryDbModel,
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
        order: ["categoryId"],
      });
      return subCategories;
    } catch (error) {
      throw error;
    }
  };

  public getAllByCategoryId = async (
    categoryId: number
  ): Promise<SubCategoryDbModel[]> => {
    try {
      const subCategories = await this.repository.findAll({
        where: {
          categoryId,
        },
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
            model: CategoryDbModel,
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
      return subCategories;
    } catch (error) {
      throw error;
    }
  };

  public getSubCategoryById = async (
    id: number,
    checkIsActive = true
  ): Promise<SubCategoryDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const subCategory = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: CategoryDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!subCategory)
        throw new ApiError({
          message: Exceptions.INVALID_SUBCATEGORY,
          statusCode: StatusCode.NOTFOUND,
        });
      return subCategory;
    } catch (error) {
      throw error;
    }
  };

  public updateSubCategory = async (
    subCategory: SubCategory,
    id: number,
    userId: number
  ): Promise<SubCategoryDbModel> => {
    try {
      const updateSubCategory = await this.repository.update(
        { ...subCategory, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateSubCategory[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_SUBCATEGORY,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getSubCategoryById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteSubCategoryById = async (
    id: number,
    userId: number
  ): Promise<SubCategoryDbModel> => {
    try {
      const subCategory = await this.getSubCategoryById(id, false);
      subCategory.updatedBy = userId;
      await subCategory.save();
      await subCategory.destroy();
      return subCategory;
    } catch (error) {
      throw error;
    }
  };
}
