const { Joi } = require("express-validation");

export const CreateSMSTemplatePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    templateType: Joi.string().required(),
    contentLanguage: Joi.string().required(),
    body: Joi.string().required(),
  }),
};

export const UpdateSMSTemplatePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    templateType: Joi.string().required(),
    contentLanguage: Joi.string().required(),
    body: Joi.string().required(),
    isActive: Joi.boolean().required(),
  }),
};
