const { Joi } = require("express-validation");

export const CreateSubCategoryPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    categoryId: Joi.number().required(),
  }),
};

export const UpdateSubCategoryPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    isActive: Joi.boolean().required(),
    categoryId: Joi.number().required(),
  }),
};
