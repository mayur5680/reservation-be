import { Op, Sequelize } from "sequelize";
import { BaseInterface } from "./baseDbInterface";
import { Exceptions } from "../exception";
import { Actions, ExcludeAttributes, Loglevel, StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { IvrsVoiceCall } from "../db/interface";
import { IvrsDetailsDbModel, IvrsVoiceCallDbModel } from "../db/models";
import { Log } from "../context/Logs";
let moment = require("moment-timezone");

export class IvrsVoiceCallDbInterface extends BaseInterface<IvrsVoiceCallDbModel> {
  public constructor(sequelize: Sequelize) {
    super(IvrsVoiceCallDbModel, sequelize);
  }

  public create = async (
    IvrsVoiceCallRequest: IvrsVoiceCall[],
    uniqueId: string
  ): Promise<void> => {
    try {
      const createIvrsVoiceCalls = await this.repository.bulkCreate(
        IvrsVoiceCallRequest as any,
        {
          updateOnDuplicate: ["fromPhoneNo", "time"],
        }
      );

      Log.writeLog(
        Loglevel.INFO,
        "saveIvrsVoiceCall",
        Actions.CREATED,
        createIvrsVoiceCalls,
        uniqueId
      );

      if (!createIvrsVoiceCalls)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
    } catch (error) {
      Log.writeLog(
        Loglevel.ERROR,
        "saveIvrsVoiceCall",
        Actions.CREATED,
        error,
        uniqueId
      );
      throw error;
    }
  };

  public getCallDetails = async (
    ivrsDetailsDbModel: IvrsDetailsDbModel
  ): Promise<IvrsVoiceCallDbModel | null> => {
    try {
      const ivrsDetail = await this.repository.findOne({
        where: {
          fromPhoneNo: ivrsDetailsDbModel.from,
          time: {
            [Op.between]: [
              new Date(
                moment(ivrsDetailsDbModel.callstart).tz("Asia/Singapore")
              ),
              new Date(moment(ivrsDetailsDbModel.callend).tz("Asia/Singapore")),
            ],
          },
        },
        attributes: { exclude: ExcludeAttributes },
      });
      return ivrsDetail;
    } catch (error) {
      throw error;
    }
  };

  public getUnlinkCall = async (): Promise<IvrsVoiceCallDbModel[]> => {
    try {
      const ivrsVoiceCall = await this.repository.findAll({
        where: {
          IvrsDetailId: null,
          isLink: false,
        },
        attributes: { exclude: ExcludeAttributes },
      });
      return ivrsVoiceCall;
    } catch (error) {
      throw error;
    }
  };
}
