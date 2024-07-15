import { Sequelize, Transaction } from "sequelize";
import { Checkout } from "../db/interface";
import { CheckoutDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class CheckoutDbInterface extends BaseInterface<CheckoutDbModel> {
  public constructor(sequelize: Sequelize) {
    super(CheckoutDbModel, sequelize);
  }

  public create = async (
    checkout: Checkout,
    transaction: Transaction
  ): Promise<CheckoutDbModel> => {
    try {
      const createCheckout = await this.repository.create(
        { ...checkout },
        { transaction }
      );
      if (!createCheckout)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createCheckout;
    } catch (error) {
      throw error;
    }
  };
}
