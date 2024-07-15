import { Op, Sequelize } from "sequelize";
import { OutletTableSection } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  OutletTableSectionDbModel,
  TableSectionDbModel,
  OutletTableDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class OutletTablseSectionDbInterface extends BaseInterface<OutletTableSectionDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletTableSectionDbModel, sequelize);
  }

  public create = async (
    outletTable: number[],
    tableSectionId: number,
    userId: number,
    outletSeatingTypeId: number,
    isPrivate = false
  ): Promise<OutletTableSectionDbModel[]> => {
    try {
      let outletTableSections: OutletTableSection[] = [];

      outletTable.map((outletTable) => {
        const outletTableSection: OutletTableSection = {
          outletTableId: outletTable,
          tableSectionId,
          isPrivate,
          createdBy: userId,
          updatedBy: userId,
        };
        outletTableSections.push(outletTableSection);
      });

      const createOutletTableSection = await this.repository.bulkCreate(
        outletTableSections as any
      );

      //   const createOutletTableSection = await this.repository.create({
      //     outletTableId,
      //     tableSectionId,
      //     createdBy: userId,
      //     updatedBy: userId,
      //   });
      if (!createOutletTableSection)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return this.getAllOutletTableSectionById(outletSeatingTypeId);
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletTableSectionById = async (
    outletSeatingTypeId: number
  ): Promise<OutletTableSectionDbModel[]> => {
    try {
      const outletTableSection = await this.repository.findAll({
        where: { isActive: true },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: TableSectionDbModel,
            where: { outletSeatingTypeId, isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!outletTableSection)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
      return outletTableSection;
    } catch (error) {
      throw error;
    }
  };

  public getOutletTableSectionById = async (
    outletTableIds: number[],
    isPrivate = true
  ): Promise<OutletTableSectionDbModel[]> => {
    try {
      let query: any = {
        outletTableId: {
          [Op.in]: outletTableIds,
        },
      };
      isPrivate && (query.isPrivate = true);
      const outletTable = await this.repository.findAll({
        where: query,
        attributes: { exclude: ExcludeAttributes },
      });
      return outletTable;
    } catch (error) {
      throw error;
    }
  };

  //Delete OutletTable By TablseSeactionId
  public deleteOutletGroupTable = async (
    tableSectionId: number
  ): Promise<void> => {
    try {
      await this.repository.destroy({
        where: { tableSectionId },
      });
    } catch (error) {
      throw error;
    }
  };

  //Delete OutletTable By OutletTableId
  public deleteOutletByOutletTableId = async (
    outletTableId: number
  ): Promise<void> => {
    try {
      await this.repository.destroy({
        where: { outletTableId },
      });
    } catch (error) {
      throw error;
    }
  };
}
