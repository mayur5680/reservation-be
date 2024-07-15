import { Sequelize } from "sequelize";
import {
  CustomerDbModel,
  IvrsCallLogsDbModel,
  IvrsDetailsDbModel,
  OutletDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { ExcludeAttributes, StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class IvrsCallLogsDbInterface extends BaseInterface<IvrsCallLogsDbModel> {
  public constructor(sequelize: Sequelize) {
    super(IvrsCallLogsDbModel, sequelize);
  }

  public create = async (
    ivrsId: number,
    logs: string,
    userId: number
  ): Promise<IvrsCallLogsDbModel> => {
    try {
      const createIvrsCallLogs = await this.repository.create({
        ivrsId,
        logs,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createIvrsCallLogs)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createIvrsCallLogs;
    } catch (error) {
      throw error;
    }
  };

  public getAllLogsByIvrsId = async (
    ivrsId: number
  ): Promise<IvrsCallLogsDbModel[]> => {
    try {
      const logs = await this.repository.findAll({
        where: {
          ivrsId,
        },
        include: [
          {
            model: IvrsDetailsDbModel,
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: CustomerDbModel,
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: OutletDbModel,
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return logs;
    } catch (error) {
      throw error;
    }
  };
}
