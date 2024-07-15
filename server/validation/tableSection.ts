const { Joi } = require("express-validation");

export const CreateTableSectionPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    color: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    outletTable: Joi.array().items(Joi.number()).required(),
    minPax: Joi.number(),
    maxPax: Joi.number(),
  }),
};

export const UpdateTableSectionPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    color: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    isActive: Joi.boolean().required(),
    minPax: Joi.number(),
    maxPax: Joi.number(),
  }),
};
