import { Op, Sequelize, col, fn } from "sequelize";
import { Section } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  OutletDbModel,
  PreOrderItemDbModel,
  SectionDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class SectionDbInterface extends BaseInterface<SectionDbModel> {
  public constructor(sequelize: Sequelize) {
    super(SectionDbModel, sequelize);
  }

  public create = async (
    section: Section,
    userId: number
  ): Promise<SectionDbModel> => {
    try {
      const createSection = await this.repository.create({
        ...section,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createSection)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createSection;
    } catch (error) {
      throw error;
    }
  };

  public getAllSection = async (id: number): Promise<SectionDbModel[]> => {
    try {
      const getAllSections = await this.repository.findAll({
        where: {
          outletId: {
            [Op.or]: [id, null],
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
      return getAllSections;
    } catch (error) {
      throw error;
    }
  };

  public getSectionByIdAndOutletId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<SectionDbModel> => {
    try {
      let query: any = { id, outletId };
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
          message: Exceptions.INVALID_SECTION,
          statusCode: StatusCode.NOTFOUND,
        });
      return section;
    } catch (error) {
      throw error;
    }
  };

  public getSectionById = async (
    id: number,
    checkIsActive = true
  ): Promise<SectionDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const section = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
      });
      if (!section)
        throw new ApiError({
          message: Exceptions.INVALID_SECTION,
          statusCode: StatusCode.NOTFOUND,
        });
      return section;
    } catch (error) {
      throw error;
    }
  };

  public getSectionByIds = async (ids: number[]): Promise<SectionDbModel> => {
    try {
      const section = await this.repository.findOne({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
        attributes: { exclude: ExcludeAttributes },
      });
      if (!section)
        throw new ApiError({
          message: Exceptions.INVALID_SECTION,
          statusCode: StatusCode.NOTFOUND,
        });
      return section;
    } catch (error) {
      throw error;
    }
  };

  public updateSection = async (
    section: Section,
    id: number,
    outletId: number,
    userId: number
  ): Promise<SectionDbModel> => {
    try {
      const updateSection = await this.repository.update(
        { ...section, updatedBy: userId },
        {
          where: {
            id,
            outletId,
          },
        }
      );

      if (updateSection[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_SECTION,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getSectionByIdAndOutletId(id, outletId, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteSection = async (
    id: number,
    outletId: number,
    userId: number
  ): Promise<SectionDbModel> => {
    try {
      const section = await this.getSectionByIdAndOutletId(id, outletId, false);
      section.updatedBy = userId;
      await section.save();
      await section.destroy();
      return section;
    } catch (error) {
      throw error;
    }
  };

  public getSectionByOutletId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<SectionDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const section = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: {
          model: PreOrderItemDbModel,
          required: false,
          where: { outletId, isActive: true },
          attributes: { exclude: ExcludeAttributes },
        },
      });
      if (!section)
        throw new ApiError({
          message: Exceptions.INVALID_SECTION,
          statusCode: StatusCode.NOTFOUND,
        });
      return section;
    } catch (error) {
      throw error;
    }
  };

  public getAllSectionByCompanyId = async (
    companyIds: number[]
  ): Promise<SectionDbModel[]> => {
    try {
      const getAllSections = await this.repository.findAll({
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
      return getAllSections;
    } catch (error) {
      throw error;
    }
  };

  public getSectionForMeal = async (
    ids: number[],
    query: any
  ): Promise<SectionDbModel[]> => {
    try {
      const section = await this.repository.findAll({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
        attributes: { exclude: ExcludeAttributes },
        include: {
          model: PreOrderItemDbModel,
          required: false,
          where: query,
          attributes: { exclude: ExcludeAttributes },
          separate: true,
        },
      });
      return section;
    } catch (error) {
      throw error;
    }
  };
}
