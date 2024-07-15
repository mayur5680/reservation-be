const { Joi } = require("express-validation");

export const BasicInformationPayload = {
  body: Joi.object({
    seatingType: Joi.array().items(Joi.number()).required(),
    seatType: Joi.array().items(Joi.number()).required(),
  }),
};
