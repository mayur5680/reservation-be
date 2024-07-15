const { Joi } = require("express-validation");

export const CreateSeatingTypePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
  }),
};

export const UpdateSeatingTypePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    isActive: Joi.boolean().allow(null, ""),
  }),
};
