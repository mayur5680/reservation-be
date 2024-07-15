import { Sequelize } from "sequelize";
import { Verification } from "../db/interface";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { VerificationDbModel } from "../db/models";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { VerifyCodeRequest } from "../@types/auth";

export class VerificationDbInterface extends BaseInterface<VerificationDbModel> {
  public constructor(sequelize: Sequelize) {
    super(VerificationDbModel, sequelize);
  }

  public create = async (
    verification: Verification
  ): Promise<VerificationDbModel> => {
    try {
      const createVerificaion = await this.repository.create({
        ...verification,
      });
      if (!createVerificaion)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createVerificaion;
    } catch (error) {
      throw error;
    }
  };

  public findByIdAndCode = async (
    verifyCodeRequest: VerifyCodeRequest
  ): Promise<VerificationDbModel> => {
    try {
      const verify = await VerificationDbModel.findOne({
        where: {
          guid: verifyCodeRequest.verificationToken,
          code: verifyCodeRequest.code,
          isActive: true,
        },
      });
      if (!verify) {
        throw new ApiError({
          message: Exceptions.INVALID_CODE,
          statusCode: StatusCode.BAD_REQUEST,
        });
      }
      verify.isActive = false;
      await verify.save();

      return verify;
    } catch (error) {
      throw error;
    }
  };
}
