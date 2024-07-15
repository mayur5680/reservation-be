const { Joi } = require("express-validation");

export const CreateTagPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    tagCategoryId: Joi.number().required(),
  }),
};

export const UpdateTagPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    isActive: Joi.boolean().required(),
    tagCategoryId: Joi.number().required(),
  }),
};

export const CreateOutletTagPayload = {
  body: Joi.object({
    tagId: Joi.number().required(),
  }),
};

export const UpdateOutletTagPayload = {
  body: Joi.object({
    tagId: Joi.number().required(),
    isActive: Joi.boolean().required(),
  }),
};
