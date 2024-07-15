const { Joi } = require("express-validation");

export const CreateCategoryPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
  }),
};

export const UpdateCategoryPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    isActive: Joi.boolean().required(),
  }),
};
