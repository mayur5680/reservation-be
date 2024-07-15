import { Joi as coreJoi } from "express-validation";
import { BookingStatus } from "../context";
const Joi = coreJoi.extend(require("@joi/date"));

export const UpdateInvoicePayload = {
  body: Joi.object({
    status: Joi.string().required(),
    occasion: Joi.string().allow(null, ""),
    specialRequest: Joi.string().allow(null, ""),
    seatingPreference: Joi.string().allow(null, ""),
    reservationNotes: Joi.string().allow(null, ""),
    dietaryRestriction: Joi.array()
      .items(Joi.string().allow(null, ""))
      .allow(null, ""),
    customerCompanyName: Joi.string().allow(null, ""),
    isCharge: Joi.boolean(),
    tableChangeRequest: Joi.object({
      noOfAdult: Joi.number().min(1).required(),
      noOfChild: Joi.number().required(),
      startTime: Joi.string().required(),
      date: Joi.date().format("DD-MM-YYYY").required(),
      outletTables: Joi.array().items(Joi.number()).required(),
      endDate: Joi.date().format("DD-MM-YYYY"),
      endTime: Joi.string(),
    }).allow(null),
  }),
};

export const FilterInvoicePayload = {
  body: Joi.object({
    date: Joi.date().format("DD-MM-YYYY"),
    mealType: Joi.string().allow(null, ""),
    status: Joi.string().allow(null, ""),
  }),
};

export const UpdateInvoiceForMail = {
  body: Joi.object({
    status: Joi.string()
      .valid(BookingStatus.CONFIRMED, BookingStatus.CANCELLED)
      .required(),
  }),
};
