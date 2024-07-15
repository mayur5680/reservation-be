const { Joi } = require("express-validation");

export const CreateSectionPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
  }),
};

export const UpdateSectionPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    isActive: Joi.boolean().required(),
  }),
};

export const GetAllSectionsByCompanyIdsPayload = {
  body: Joi.object({
    companyIds: Joi.array().items(Joi.number().min(1).required()).required(),
  }),
};
