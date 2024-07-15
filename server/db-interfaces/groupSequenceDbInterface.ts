import { Sequelize } from "sequelize";
import { GroupSequnceTable } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  GroupSequenceTableDbModel,
  GroupPossibilityDbModel,
  GroupTableDbModel,
  OutletSeatingTypeDbModel,
  OutletTableDbModel,
  TableDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class GroupSequnceDbInterface extends BaseInterface<GroupSequenceTableDbModel> {
  public constructor(sequelize: Sequelize) {
    super(GroupSequenceTableDbModel, sequelize);
  }
  public create = async (
    outletTable: number[],
    groupTableId: number,
    userId: number
  ): Promise<void> => {
    try {
      let outletGroupTables: GroupSequnceTable[] = [];

      outletTable.map((outletTable, index) => {
        const groupSequqncetable: GroupSequnceTable = {
          outletTableId: outletTable,
          groupTableId,
          createdBy: userId,
          updatedBy: userId,
          index: index + 1,
        };
        outletGroupTables.push(groupSequqncetable);
      });

      const createGroupSequnceTable = await this.repository.bulkCreate(
        outletGroupTables as any
      );

      if (!createGroupSequnceTable)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
    } catch (error) {
      throw error;
    }
  };

  //Get Sequence by GroupId and TableId
  public getSequenceByGroupIdAndTableId = async (
    groupTableId: number,
    outletTableId: number
  ): Promise<GroupSequenceTableDbModel> => {
    try {
      const sequence = await this.repository.findOne({
        where: { groupTableId, outletTableId, isActive: true },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: GroupTableDbModel,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: TableDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
      });
      if (!sequence)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
      return sequence;
    } catch (error) {
      throw error;
    }
  };

  //Delete Sequence By groupid
  public deleteSequence = async (groupTableId: number): Promise<number> => {
    try {
      const groupSequnce = await this.repository.destroy({
        where: { groupTableId },
      });
      return groupSequnce;
    } catch (error) {
      throw error;
    }
  };
}
