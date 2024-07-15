const { Joi } = require("express-validation");

export const CreateRolePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
  }),
};

export const UpdateRolePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    isActive: Joi.boolean(),
  }),
};
