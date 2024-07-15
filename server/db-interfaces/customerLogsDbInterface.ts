import { Sequelize } from "sequelize";
import { CustomerLogsDbModel } from "../db/models";
import { CustomerLogs } from "../db/interface";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class CustomerLogsDbInterface extends BaseInterface<CustomerLogsDbModel> {
  public constructor(sequelize: Sequelize) {
    super(CustomerLogsDbModel, sequelize);
  }

  public create = async (
    customerLogs: CustomerLogs
  ): Promise<CustomerLogsDbModel> => {
    try {
      const createCustomerLogs = await this.repository.create({
        ...customerLogs,
      });
      if (!createCustomerLogs)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createCustomerLogs;
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
