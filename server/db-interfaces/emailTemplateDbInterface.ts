import { Sequelize, col, fn } from "sequelize";
import { EmailTemplate } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { EmailTemplateDbModel, UserDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class EmailTemplateDbInterface extends BaseInterface<EmailTemplateDbModel> {
  public constructor(sequelize: Sequelize) {
    super(EmailTemplateDbModel, sequelize);
  }

  //Create EmailTemplate
  public create = async (
    emailTemplate: EmailTemplate,
    userId: number
  ): Promise<EmailTemplateDbModel> => {
    try {
      const createEmailTemplate = await this.repository.create({
        ...emailTemplate,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createEmailTemplate)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createEmailTemplate;
    } catch (error) {
      throw error;
    }
  };

  //Get All EmailTemplates
  public getAllEmailTemplates = async (
    outletId: number
  ): Promise<EmailTemplateDbModel[]> => {
    try {
      const emailTemplates = await this.repository.findAll({
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
        include: [
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        order: ["id"],
      });
      return emailTemplates;
    } catch (error) {
      throw error;
    }
  };

  //Get EmailTemplate By Id
  public getEmailTemplateById = async (
    id: number,
    checkIsActive = true
  ): Promise<EmailTemplateDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const emailTemplate = await this.repository.findOne({
        where: query,
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
        include: [
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      if (!emailTemplate)
        throw new ApiError({
          message: Exceptions.INVALID_EMAIL_TEMPLATE,
          statusCode: StatusCode.NOTFOUND,
        });
      return emailTemplate;
    } catch (error) {
      throw error;
    }
  };

  public updateEmailTemplate = async (
    emailTemplate: EmailTemplate,
    id: number,
    userId: number
  ): Promise<EmailTemplateDbModel> => {
    try {
      const updateEmailTemplate = await this.repository.update(
        { ...emailTemplate, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateEmailTemplate[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_EMAIL_TEMPLATE,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getEmailTemplateById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public delete = async (
    id: number,
    userId: number
  ): Promise<EmailTemplateDbModel> => {
    try {
      const template = await this.getEmailTemplateById(id, false);
      template.updatedBy = userId;
      await template.save();
      await template.destroy();
      return template;
    } catch (error) {
      throw error;
    }
  };

  //Get EmailTemplate By Name and outletId
  public getEmailTemplateByNameAndOutletId = async (
    outletId: number,
    templateType: string
  ): Promise<EmailTemplateDbModel | null> => {
    try {
      const emailTemplate = await this.repository.findOne({
        where: {
          outletId,
          templateType,
          isActive: true,
        },
        attributes: { exclude: ExcludeAttributes },
      });
      return emailTemplate;
    } catch (error) {
      throw error;
    }
  };
}
