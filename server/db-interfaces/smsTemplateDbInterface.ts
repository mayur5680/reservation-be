import { Sequelize, col, fn } from "sequelize";
import { SMSTemplate } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { OutletDbModel, SMSTemplateDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class SMSTemplateDbInterface extends BaseInterface<SMSTemplateDbModel> {
  public constructor(sequelize: Sequelize) {
    super(SMSTemplateDbModel, sequelize);
  }

  //Create SMSTemplate
  public create = async (
    smsTemplate: SMSTemplate,
    userId: number
  ): Promise<SMSTemplateDbModel> => {
    try {
      const createSMSTemplate = await this.repository.create({
        ...smsTemplate,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createSMSTemplate)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createSMSTemplate;
    } catch (error) {
      throw error;
    }
  };

  //Get All SMSTemplate with outletId
  public getAllSMSTemplate = async (
    outletId: number
  ): Promise<SMSTemplateDbModel[]> => {
    try {
      const smsTemplates = await this.repository.findAll({
        where: {
          outletId,
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
        order: ["id"],
        include: [
          {
            model: OutletDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      return smsTemplates;
    } catch (error) {
      throw error;
    }
  };

  //Get SMSTemplate By Id
  public getSMSTemplateById = async (
    id: number,
    checkIsActive = true
  ): Promise<SMSTemplateDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const smsTemplate = await this.repository.findOne({
        where: query,
        include: [
          {
            model: OutletDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
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
      });
      if (!smsTemplate)
        throw new ApiError({
          message: Exceptions.INVALID_SMS_TEMPLATE,
          statusCode: StatusCode.NOTFOUND,
        });
      return smsTemplate;
    } catch (error) {
      throw error;
    }
  };

  public updateSMSTemplate = async (
    smsTemplate: SMSTemplate,
    id: number,
    userId: number
  ): Promise<SMSTemplateDbModel> => {
    try {
      const updateSMSTemplate = await this.repository.update(
        { ...smsTemplate, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateSMSTemplate[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_SMS_TEMPLATE,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getSMSTemplateById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public delete = async (
    id: number,
    userId: number
  ): Promise<SMSTemplateDbModel> => {
    try {
      const smsTemplate = await this.getSMSTemplateById(id, false);
      smsTemplate.updatedBy = userId;
      await smsTemplate.save();
      await smsTemplate.destroy();
      return smsTemplate;
    } catch (error) {
      throw error;
    }
  };

  //Get SMSTemplate By Id
  public getSMSTemplateByOulet = async (
    outletId: number,
    templateType: string
  ): Promise<SMSTemplateDbModel | null> => {
    try {
      const smsTemplate = await this.repository.findOne({
        where: {
          outletId,
          templateType,
          isActive: true,
        },
        attributes: { exclude: ExcludeAttributes },
      });

      return smsTemplate;
    } catch (error) {
      throw error;
    }
  };
}
