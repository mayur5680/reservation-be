import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const TimeSlotRequestPayload = {
  body: Joi.object({
    noOfAdult: Joi.number().min(1).required(),
    noOfChild: Joi.number().required(),
    date: Joi.date().format("DD-MM-YYYY").required(),
    outletId: Joi.number().required(),
    checkPax: Joi.boolean().default(false),
  }),
};
