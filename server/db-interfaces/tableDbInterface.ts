import { Op, Sequelize, col, fn } from "sequelize";
import { Table } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { TableDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class TableDbInterface extends BaseInterface<TableDbModel> {
  public constructor(sequelize: Sequelize) {
    super(TableDbModel, sequelize);
  }

  public create = async (
    table: Table,
    userId: number
  ): Promise<TableDbModel> => {
    try {
      const createTable = await this.repository.create({
        ...table,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createTable)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createTable;
    } catch (error) {
      throw error;
    }
  };

  public getAllTable = async (id: number): Promise<TableDbModel[]> => {
    try {
      const getAllTable = await this.repository.findAll({
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
      return getAllTable;
    } catch (error) {
      throw error;
    }
  };

  public getTableByOutletId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<TableDbModel> => {
    try {
      let query: any = { id, outletId };
      checkIsActive && (query.isActive = true);
      const table = await this.repository.findOne({
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
      if (!table)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
      return table;
    } catch (error) {
      throw error;
    }
  };

  public getTableById = async (id: number): Promise<TableDbModel> => {
    try {
      let query: any = { id, isActive: true };
      const table = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
      });
      if (!table)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
      return table;
    } catch (error) {
      throw error;
    }
  };

  public updateTable = async (
    table: Table,
    id: number,
    outletId: number,
    userId: number
  ): Promise<TableDbModel> => {
    try {
      const updateTable = await this.repository.update(
        { ...table, updatedBy: userId },
        {
          where: {
            id,
            outletId,
          },
        }
      );

      if (updateTable[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getTableByOutletId(id, outletId, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteTable = async (
    id: number,
    outletId: number,
    userId: number
  ): Promise<TableDbModel> => {
    try {
      const table = await this.getTableByOutletId(id, outletId, false);
      table.updatedBy = userId;
      await table.save();
      await table.destroy();
      return table;
    } catch (error) {
      throw error;
    }
  };
}
