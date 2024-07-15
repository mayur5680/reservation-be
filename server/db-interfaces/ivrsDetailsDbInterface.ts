import { Op, Sequelize } from "sequelize";
import { BaseInterface } from "./baseDbInterface";
import { Exceptions } from "../exception";
import { ExcludeAttributes, StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { IvrsDetails } from "../db/interface";
import {
  CustomerDbModel,
  IvrsDetailsDbModel,
  IvrsVoiceCallDbModel,
  OutletDbModel,
} from "../db/models";
import { UpdateIvrsDetails } from "../@types/ivrsDetails";
let moment = require("moment-timezone");

export class IvrsDetailDbInterface extends BaseInterface<IvrsDetailsDbModel> {
  public constructor(sequelize: Sequelize) {
    super(IvrsDetailsDbModel, sequelize);
  }

  public getIvrsDetails = async (
    outletId: number
  ): Promise<IvrsDetailsDbModel[]> => {
    try {
      const ivrsDetail = await this.repository.findAll({
        where: {
          outletId,
        },
        attributes: { exclude: ExcludeAttributes },
        order: [["callstart", "ASC"]],
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
          {
            model: IvrsVoiceCallDbModel,
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return ivrsDetail;
    } catch (error) {
      throw error;
    }
  };

  public getIvrsDetailById = async (
    id: number
  ): Promise<IvrsDetailsDbModel> => {
    try {
      const ivrsDetail = await this.repository.findOne({
        where: {
          id,
        },
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
        order: [["callstart", "ASC"]],
      });

      if (!ivrsDetail)
        throw new ApiError({
          message: Exceptions.INVALID_IVRS_RECORD,
          statusCode: StatusCode.NOTFOUND,
        });
      return ivrsDetail;
    } catch (error) {
      throw error;
    }
  };

  // update IVRS by Id
  public updateIvrsDetails = async (
    id: number,
    ivrsDetail: UpdateIvrsDetails
  ): Promise<IvrsDetailsDbModel> => {
    try {
      const updateIvrsDetail = await this.repository.update(
        { ...ivrsDetail },
        {
          where: {
            id,
          },
        }
      );

      if (updateIvrsDetail[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_IVRS_RECORD,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getIvrsDetailById(id);
    } catch (error) {
      throw error;
    }
  };

  //get by callerId
  public getIvrsDetailByCallerId = async (
    callerId: string
  ): Promise<IvrsDetailsDbModel | null> => {
    try {
      const ivrsDetail = await this.repository.findOne({
        where: {
          callerId,
        },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: CustomerDbModel,
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });

      return ivrsDetail;
    } catch (error) {
      throw error;
    }
  };

  public create = async (ivrsDetails: IvrsDetails): Promise<void> => {
    try {
      const createIvrsDetail = await this.repository.create({
        ...ivrsDetails,
      });
      if (!createIvrsDetail)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
    } catch (error) {
      throw error;
    }
  };

  //get unlink voicecall
  public getUnfinishCall = async (
    from: string
  ): Promise<IvrsDetailsDbModel | null> => {
    try {
      const ivrsDetail = await this.repository.findOne({
        where: {
          from,
          is_completed: false,
        },
        attributes: { exclude: ExcludeAttributes },
      });

      return ivrsDetail;
    } catch (error) {
      throw error;
    }
  };

  public getLinkCall = async (
    ivrsVoiceCallDbModel: IvrsVoiceCallDbModel
  ): Promise<IvrsDetailsDbModel | null> => {
    try {
      const ivrsDetail = await this.repository.findOne({
        where: {
          from: ivrsVoiceCallDbModel.fromPhoneNo,
          [Op.and]: [
            {
              callstart: {
                [Op.lte]: new Date(ivrsVoiceCallDbModel.time),
              },
            },
            {
              callend: {
                [Op.gte]: new Date(ivrsVoiceCallDbModel.time),
              },
            },
          ],
        },
        attributes: { exclude: ExcludeAttributes },
      });
      return ivrsDetail;
    } catch (error) {
      throw error;
    }
  };
}
