import { Sequelize } from "sequelize";
import { Payment } from "../db/interface";
import { PaymentDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class PaymentDbInterface extends BaseInterface<PaymentDbModel> {
  public constructor(sequelize: Sequelize) {
    super(PaymentDbModel, sequelize);
  }

  public create = async (payment: Payment): Promise<PaymentDbModel> => {
    try {
      const createPayment = await this.repository.create({ ...payment });
      if (!createPayment)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createPayment;
    } catch (error) {
      throw error;
    }
  };

  public getPaymentBySessionId = async (
    sessionId: string
  ): Promise<PaymentDbModel> => {
    try {
      const createPayment = await this.repository.findOne({
        where: {
          sessionId,
        },
      });
      if (!createPayment)
        throw new ApiError({
          message: Exceptions.INVALID_SESSION,
          statusCode: StatusCode.NOTFOUND,
        });
      return createPayment;
    } catch (error) {
      throw error;
    }
  };
}
