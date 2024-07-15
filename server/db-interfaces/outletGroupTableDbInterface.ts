import { Op, Sequelize } from "sequelize";
import { OutletGroupTable } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  OutletGroupTableDbModel,
  GroupPossibilityDbModel,
  GroupTableDbModel,
  OutletTableDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class OutletGroupDbInterface extends BaseInterface<OutletGroupTableDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletGroupTableDbModel, sequelize);
  }

  public create = async (
    outletTable: number[],
    groupPossibilityId: number,
    userId: number
  ): Promise<void> => {
    try {
      let outletGroupTables: OutletGroupTable[] = [];

      outletTable.map((outletTable, index) => {
        const outletGrouptable: OutletGroupTable = {
          outletTableId: outletTable,
          groupPossibilityId,
          createdBy: userId,
          updatedBy: userId,
          index: index + 1,
        };
        outletGroupTables.push(outletGrouptable);
      });

      const createOutletGroupTable = await this.repository.bulkCreate(
        outletGroupTables as any
      );

      if (!createOutletGroupTable)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
    } catch (error) {
      throw error;
    }
  };

  public getOutletGroupTableById = async (
    id: number,
    groupPossibilityId: number,
    checkIsActive = true
  ): Promise<OutletGroupTableDbModel> => {
    try {
      let query: any = { id, groupPossibilityId };
      checkIsActive && (query.isActive = true);
      const outletGroupTable = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: GroupPossibilityDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: GroupTableDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
      });
      if (!outletGroupTable)
        throw new ApiError({
          message: Exceptions.INVALID_OUTLET_GROUP_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
      return outletGroupTable;
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletGroupTableById = async (
    outletSeatingTypeId: number
  ): Promise<OutletGroupTableDbModel[]> => {
    try {
      const outletGroupTable = await this.repository.findAll({
        where: { isActive: true },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: GroupPossibilityDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: GroupTableDbModel,
                where: { outletSeatingTypeId },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: OutletTableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!outletGroupTable)
        throw new ApiError({
          message: Exceptions.INVALID_OUTLET_GROUP_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
      return outletGroupTable;
    } catch (error) {
      throw error;
    }
  };

  public deleteOutletGroupTable = async (
    groupPossibilityId: number
  ): Promise<void> => {
    try {
      const OutletGroupTable = await this.repository.destroy({
        where: { groupPossibilityId },
      });
    } catch (error) {
      throw error;
    }
  };

  public deleteOutletGroupTableByPossibilitesIds = async (
    groupPossibilityIds: number[]
  ): Promise<void> => {
    try {
      await this.repository.destroy({
        where: {
          groupPossibilityId: {
            [Op.in]: groupPossibilityIds,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  };
}
