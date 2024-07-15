import { Sequelize } from "sequelize";
import { ShortenLinkDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class ShortenLinkDbInterface extends BaseInterface<ShortenLinkDbModel> {
  public constructor(sequelize: Sequelize) {
    super(ShortenLinkDbModel, sequelize);
  }

  public create = async (
    code: string,
    source: string
  ): Promise<ShortenLinkDbModel> => {
    try {
      const createCheckout = await this.repository.create({ code, source });
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

  //Get ShortenLink By Id
  public getShortenLinkById = async (
    id: number
  ): Promise<ShortenLinkDbModel> => {
    try {
      const link = await this.repository.findOne({
        where: {
          id,
        },
      });
      if (!link)
        throw new ApiError({
          message: Exceptions.CUSTOM_ERROR,
          devMessage: "Invalid URL",
          statusCode: StatusCode.BAD_REQUEST,
        });
      return link;
    } catch (error) {
      throw error;
    }
  };

  //Get ShortenLink By code
  public getShortenLinkByCode = async (
    code: string
  ): Promise<ShortenLinkDbModel | null> => {
    try {
      const link = await this.repository.findOne({
        where: {
          code,
        },
      });
      return link;
    } catch (error) {
      throw error;
    }
  };
}
