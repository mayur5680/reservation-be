import { Sequelize, col, fn } from "sequelize";
import { Materials } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  CategoryDbModel,
  MaterialsDbModel,
  SubCategoryDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class MaterialsDbInterface extends BaseInterface<MaterialsDbModel> {
  public constructor(sequelize: Sequelize) {
    super(MaterialsDbModel, sequelize);
  }

  //create Material
  public create = async (
    material: Materials,
    userId: Number
  ): Promise<MaterialsDbModel> => {
    try {
      const createMaterial = await this.repository.create({
        ...material,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createMaterial)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createMaterial;
    } catch (error) {
      throw error;
    }
  };

  //get all Material by outletId
  public getAllMaterials = async (query: any): Promise<MaterialsDbModel[]> => {
    try {
      const materials = await this.repository.findAll({
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
            model: CategoryDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: SubCategoryDbModel,
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
        order: [["id", "DESC"]],
      });
      return materials;
    } catch (error) {
      throw error;
    }
  };

  //get Material by id
  public getMaterialById = async (id: number): Promise<MaterialsDbModel> => {
    try {
      const material = await this.repository.findOne({
        where: {
          id,
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
            model: SubCategoryDbModel,
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

      if (!material) {
        throw new ApiError({
          message: Exceptions.INVALID_MATERIAL,
          statusCode: StatusCode.NOTFOUND,
        });
      }
      return material;
    } catch (error) {
      throw error;
    }
  };

  //update Material by id
  public updateMaterials = async (
    id: number,
    material: Materials,
    userId: number
  ): Promise<MaterialsDbModel> => {
    try {
      const updateMaterial = await this.repository.update(
        { ...material, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateMaterial[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_MATERIAL,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getMaterialById(id);
    } catch (error) {
      throw error;
    }
  };

  //delete Material by id
  public deleteMaterial = async (
    id: number,
    userId: number
  ): Promise<MaterialsDbModel> => {
    try {
      const material = await this.getMaterialById(id);
      material.updatedBy = userId;
      await material.save();
      await material.destroy();
      return material;
    } catch (error) {
      throw error;
    }
  };
}
