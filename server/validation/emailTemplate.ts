import { EmailTemplateTypes } from "../context";

const { Joi } = require("express-validation");

export const CreateEmailTemplatePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    templateType: Joi.string()
      .valid(
        EmailTemplateTypes.BOOKED,
        EmailTemplateTypes.BOOKED_PAYMENT,
        EmailTemplateTypes.CONFIRMED
      )
      .required(),
    contentLanguage: Joi.string().required(),
    subject: Joi.string().required(),
    body: Joi.string().required(),
  }),
};

export const UpdateEmailTemplatePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    templateType: Joi.string()
      .valid(
        EmailTemplateTypes.BOOKED,
        EmailTemplateTypes.BOOKED_PAYMENT,
        EmailTemplateTypes.CONFIRMED
      )
      .required(),
    contentLanguage: Joi.string().required(),
    subject: Joi.string().required(),
    body: Joi.string().required(),
    isActive: Joi.boolean().required(),
  }),
};
