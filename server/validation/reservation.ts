import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const GetOutletTimeSlotPayload = {
  body: Joi.object({
    date: Joi.date().format("DD-MM-YYYY").required(),
    noOfAdult: Joi.number().min(1).required(),
    noOfChild: Joi.number().required(),
    preferredTime: Joi.string().required(),
    bookingType: Joi.string(),
    outletId: Joi.number(),
    checkPax: Joi.boolean().default(false),
  }),
};

export const step4Payload = {
  body: Joi.object({
    date: Joi.date().format("DD-MM-YYYY"),
    exactTime: Joi.string().required(),
    noOfAdult: Joi.number().min(1).required(),
    noOfChild: Joi.number().required(),
  }),
};

export const BookTablePayload = {
  body: Joi.object({
    date: Joi.date().format("DD-MM-YYYY").required(),
    noOfAdult: Joi.number().min(1).required(),
    noOfChild: Joi.number().required(),
    preferredTime: Joi.string().required(),
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
    diningOptionId: Joi.number().allow(null, ""),
    occasion: Joi.string().allow(null, ""),
    seatingPreference: Joi.string().allow(null, ""),
    specialRequest: Joi.string().allow(null, ""),
    reservationNotes: Joi.string().allow(null, ""),
    promocode: Joi.string().allow(null, ""),
    dietaryRestriction: Joi.array().items(Joi.string().allow(null, "")),
    diningOptionQty: Joi.number().allow(null, ""),
    isOPT: Joi.boolean(),
    basket: Joi.object({
      items: Joi.array().items({
        itemId: Joi.number().required(),
        qty: Joi.number().required(),
      }),
    }).allow(null, ""),

    diningOptions: Joi.array()
      .items({
        diningOptionId: Joi.number().required(),
        diningOptionQty: Joi.number().required(),
      })
      .allow(null),

    privateRoom: Joi.object({
      id: Joi.number().required(),
    }).allow(null),
  }),
};

export const GetAvailibleTable = {
  body: Joi.object({
    noOfAdult: Joi.number().min(1).required(),
    noOfChild: Joi.number().required(),
    startTime: Joi.string().required(),
    outletSeatingTypeId: Joi.number().required(),
    date: Joi.date().format("DD-MM-YYYY").required(),
  }),
};

export const NewBookingPayload = {
  body: Joi.object({
    noOfAdult: Joi.number().min(1).required(),
    noOfChild: Joi.number().required(),
    startTime: Joi.string().allow(null, ""),
    name: Joi.string().required(),
    lastName: Joi.string().allow(null, ""),
    email: Joi.string().allow(null, ""),
    mobileNo: Joi.string()
      .empty(/\s+/)
      .trim()
      .regex(/([+]?\d{1,2}[.-\s]?)?(\d{3}[.-]?){2}\d{4}/)
      .messages({ "string.pattern.base": `Mobile number is not valid.` })
      .max(15)
      .required(),
    bookingType: Joi.string().required(),
    specialRequest: Joi.string().allow(null, ""),
    reservationNotes: Joi.string().allow(null, ""),
    outletTables: Joi.string().required(),
    date: Joi.date().format("DD-MM-YYYY"),
  }),
};
