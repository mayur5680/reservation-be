import { Sequelize, col, fn } from "sequelize";
import { ExcludeAttributes } from "../context";
import {
  GroupTableDbModel,
  OutletSeatingTypeDbModel,
  SeatingTypeDbModel,
  GroupPossibilityDbModel,
  OutletGroupTableDbModel,
  OutletTableDbModel,
  TableDbModel,
  GroupSequenceTableDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import {
  GroupSequnceDbInterface,
  GroupPossibilityDbInterface,
  OutletGroupDbInterface,
} from "../db-interfaces";
import { GroupTable } from "../db/interface";

export class GroupTableDbInterface extends BaseInterface<GroupTableDbModel> {
  public constructor(sequelize: Sequelize) {
    super(GroupTableDbModel, sequelize);
  }

  public create = async (
    groupTable: GroupTable
  ): Promise<GroupTableDbModel> => {
    try {
      const createGroupTable = await this.repository.create({ ...groupTable });
      if (!createGroupTable)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createGroupTable;
    } catch (error) {
      throw error;
    }
  };

  public getAllGroupTableById = async (
    id: number,
    checkIsActive = true
  ): Promise<GroupTableDbModel[]> => {
    try {
      let query: any = { outletSeatingTypeId: id };
      checkIsActive && (query.isActive = true);
      const groupTable = await this.repository.findAll({
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
            model: GroupPossibilityDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletGroupTableDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
                include: [
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
              },
            ],
          },
          {
            model: GroupSequenceTableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
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
          },
          {
            model: OutletSeatingTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
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
        order: [
          ["GroupPossibility", "index", "ASC"],
          ["GroupSequenceTable", "index", "ASC"],
          ["GroupPossibility", "OutletGroupTable", "index", "ASC"],
        ],
      });
      if (!groupTable)
        throw new ApiError({
          message: Exceptions.INVALID_GROUP,
          statusCode: StatusCode.NOTFOUND,
        });
      return groupTable;
    } catch (error) {
      throw error;
    }
  };

  public getGroupTableById = async (
    id: number,
    checkIsActive = true
  ): Promise<GroupTableDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const groupTable = await this.repository.findOne({
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
            model: GroupPossibilityDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletGroupTableDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
                include: [
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
              },
            ],
          },
          {
            model: GroupSequenceTableDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
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
          },
          {
            model: OutletSeatingTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: SeatingTypeDbModel,
                where: { isActive: true },
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
        order: [
          ["GroupPossibility", "index", "ASC"],
          ["GroupSequenceTable", "index", "ASC"],
          ["GroupPossibility", "OutletGroupTable", "index", "ASC"],
        ],
      });
      if (!groupTable)
        throw new ApiError({
          message: Exceptions.INVALID_GROUP,
          statusCode: StatusCode.NOTFOUND,
        });
      return groupTable;
    } catch (error) {
      throw error;
    }
  };

  public deleteGroupTableById = async (
    groupTable: GroupTableDbModel,
    groupSequnceDbInterface: GroupSequnceDbInterface,
    groupPossibilityDbInterface: GroupPossibilityDbInterface,
    outletGroupDbInterface: OutletGroupDbInterface,
    userId: number
  ): Promise<GroupTableDbModel> => {
    try {
      //delete Group Sequence
      await groupSequnceDbInterface.deleteSequence(groupTable.id);

      const possibilities =
        await groupPossibilityDbInterface.getGroupPossibilityBygroupId(
          groupTable.id
        );
      const possibilitiesIds = possibilities.map((single) => single.id);

      await groupPossibilityDbInterface.deleteGroupPossibilityByIds(
        possibilitiesIds,
        outletGroupDbInterface
      );

      groupTable.updatedBy = userId;
      await groupTable.save();
      await groupTable.destroy();

      return groupTable;
    } catch (error) {
      throw error;
    }
  };

  public updateGroupTable = async (
    id: number,
    groupTable: GroupTable
  ): Promise<GroupTableDbModel> => {
    try {
      const updateGroupTable = await this.repository.update(
        { ...groupTable },
        {
          where: {
            id,
          },
        }
      );

      if (updateGroupTable[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_GROUP,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getGroupTableById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteGroupTable = async (
    id: number,
    userId: number
  ): Promise<GroupTableDbModel> => {
    try {
      const groupTable = await this.getGroupTableById(id, false);
      groupTable.updatedBy = userId;
      await groupTable.save();
      await groupTable.destroy();
      return groupTable;
    } catch (error) {
      throw error;
    }
  };
}
