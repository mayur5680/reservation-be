const { Joi } = require("express-validation");

export const CreateTablePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    noOfPerson: Joi.number().min(1).required(),
    shape: Joi.string().required(),
  }),
};

export const UpdateTablePayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    noOfPerson: Joi.number().min(1).required(),
    shape: Joi.string().required(),
  }),
};
