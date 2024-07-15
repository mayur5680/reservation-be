import { Sequelize, col, fn } from "sequelize";
import { SystemLog } from "../db/interface";
import {
  CustomerDbModel,
  OutletDbModel,
  OutletInvoiceDbModel,
  OutletTableBookingDbModel,
  OutletTableDbModel,
  SystemLogDbModel,
  TableDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { Actions, ExcludeAttributes, Loglevel, StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { Log } from "../context/Logs";

export class SystemLogDbInterface extends BaseInterface<SystemLogDbModel> {
  public constructor(sequelize: Sequelize) {
    super(SystemLogDbModel, sequelize);
  }

  public create = async (systemLog: SystemLog): Promise<void> => {
    try {
      const createSystemLog = await this.repository.create({ ...systemLog });
    } catch (error) {
      Log.writeLog(Loglevel.ERROR, "SystemLog", Actions.CREATED, error, "");
    }
  };

  public getLogsByOutletId = async (
    query: any
  ): Promise<SystemLogDbModel[]> => {
    try {
      const systemLogs = await this.repository.findAll({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletInvoiceDbModel,
            required: false,
            paranoid: false,
            attributes: {
              exclude: ["updatedBy", ...ExcludeAttributes],
              include: [
                [
                  fn(
                    "concat",
                    col("OutletInvoice.User.firstName"),
                    " ",
                    col("OutletInvoice.User.lastName"),
                    ",",
                    col("OutletInvoice.User.email")
                  ),
                  "updatedBy",
                ],
              ],
            },
            include: [
              {
                model: CustomerDbModel,
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: OutletDbModel,
                paranoid: false,
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: OutletTableBookingDbModel,
                paranoid: false,
                required: false,
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: OutletTableDbModel,
                    paranoid: false,
                    required: false,
                    attributes: { exclude: ExcludeAttributes },
                    include: [
                      {
                        model: TableDbModel,
                        paranoid: false,
                        required: false,
                        attributes: { exclude: ExcludeAttributes },
                      },
                    ],
                  },
                ],
              },
              {
                model: UserDbModel,
                required: false,
                paranoid: false,
                attributes: [],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return systemLogs;
    } catch (error) {
      throw error;
    }
  };

  public getAllLogs = async (query: any): Promise<SystemLogDbModel[]> => {
    try {
      const systemLogs = await this.repository.findAll({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        order: [["createdAt", "DESC"]],
      });
      return systemLogs;
    } catch (error) {
      throw error;
    }
  };

  public bulkCreate = async (systemLogs: SystemLog[]): Promise<void> => {
    try {
      const createSystemLogs = await this.repository.bulkCreate(
        systemLogs as any,
        {
          updateOnDuplicate: ["updatedAt"],
        }
      );
      if (!createSystemLogs) {
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      }
    } catch (error) {
      throw error;
    }
  };

  public deleteByInvoiceId = async (outletInvoiceId: string): Promise<void> => {
    try {
      await this.repository.destroy({
        where: {
          outletInvoiceId,
        },
        force: true,
      });
    } catch (error) {
      throw error;
    }
  };
}
