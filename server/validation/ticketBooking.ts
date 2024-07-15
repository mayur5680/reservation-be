import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const GetTicketTimeSlotPayload = {
  body: Joi.object({
    date: Joi.date().format("DD-MM-YYYY").required(),
    noOfAdult: Joi.number().min(1).required(),
    noOfChild: Joi.number().required(),
  }),
};

export const BookTicketPayload = {
  body: Joi.object({
    date: Joi.date().format("DD-MM-YYYY").required(),
    noOfAdult: Joi.number().min(1).required(),
    noOfChild: Joi.number().required(),
    bookingType: Joi.string(),
    exactTime: Joi.string().required(),
    name: Joi.string().required(),
    lastName: Joi.string().allow(null, ""),
    email: Joi.string().required(),
    mobileNo: Joi.string()
      .empty(/\s+/)
      .trim()
      .regex(/([+]?\d{1,2}[.-\s]?)?(\d{3}[.-]?){2}\d{4}/)
      .messages({ "string.pattern.base": `Mobile number is not valid.` })
      .max(15)
      .required(),
    salutation: Joi.string().required(),
    customerCompanyName: Joi.string().allow(null, ""),
    specialRequest: Joi.string().allow(null, ""),
    dietaryRestriction: Joi.array().items(Joi.string().allow(null, "")),
    occasion: Joi.string().allow(null, ""),
    isOPT: Joi.boolean(),
  }),
};
