const { Joi } = require("express-validation");

export const CreateSeatTypePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
  }),
};

export const UpdateSeatTypePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    isActive: Joi.boolean().required(),
  }),
};
