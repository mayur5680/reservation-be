const { Joi } = require("express-validation");

export const CreateGroupPayload = {
  body: Joi.object({
    outletTable: Joi.array().items(Joi.number()).required(),
    name: Joi.string(),
    minPax: Joi.number(),
    maxPax: Joi.number(),
  }),
};

export const UpdateGroupPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    minPax: Joi.number().required(),
    maxPax: Joi.number().required(),
    isActive: Joi.boolean().required(),
  }),
};

export const AddPossibilityPayload = {
  body: Joi.object({
    outletTable: Joi.array().items(Joi.number()).required(),
  }),
};
