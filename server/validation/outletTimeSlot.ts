const { Joi } = require("express-validation");

export const CreateTimeSlot = {
  body: Joi.object({
    sectionId: Joi.number().required(),
    dayofweek: Joi.number().required(),
    openingTime: Joi.string().required(),
    closingTime: Joi.string().required(),
  }),
};

export const UpdateTimeSlot = {
  body: Joi.object({
    sectionId: Joi.number().required(),
    dayofweek: Joi.number().required(),
    openingTime: Joi.string().required(),
    closingTime: Joi.string().required(),
    isActive: Joi.boolean().required(),
  }),
};
