import { Joi as coreJoi } from "express-validation";
import {
  BookingType,
  ReservationReport,
  CustomerReportFilter,
} from "../context";
const Joi = coreJoi.extend(require("@joi/date"));

export const ReservationReportPayload = {
  body: Joi.object({
    companyIds: Joi.array().items(Joi.number().min(1).required()).required(),
    fromDate: Joi.date().format("DD-MM-YYYY"),
    toDate: Joi.date().format("DD-MM-YYYY"),
    filter: Joi.string()
      .valid(ReservationReport.PAST, ReservationReport.UPCOMING)
      .required(),
    mealType: Joi.array().items(Joi.string().required()).required(),
    status: Joi.array().items(Joi.string().required()).required(),
    bookingType: Joi.array()
      .items(
        Joi.string()
          .valid(
            BookingType.NORMAL_RESERVATION,
            BookingType.PRIVATE_EVENT,
            BookingType.PRIVATE_ROOM,
            BookingType.TICKETING_EVENT
          )
          .required()
      )
      .required(),
  }),
};

export const CustomerReportPayload = {
  body: Joi.object({
    companyIds: Joi.array().items(Joi.number().min(1).required()).required(),
    fromDate: Joi.date().format("DD-MM-YYYY"),
    toDate: Joi.date().format("DD-MM-YYYY"),
    filter: Joi.string()
      .valid(CustomerReportFilter.CROSS, CustomerReportFilter.FREQUENT)
      .required(),
    outletIds: Joi.array().items(Joi.number()).allow(null),
  }),
};

export const GroupEventReportPayload = {
  body: Joi.object({
    companyIds: Joi.array().items(Joi.number().min(1).required()).required(),
    fromDate: Joi.date().format("DD-MM-YYYY"),
    toDate: Joi.date().format("DD-MM-YYYY"),
    mealType: Joi.array().items(Joi.string().required()).required(),
  }),
};

export const SingleEventReportPayload = {
  body: Joi.object({
    fromDate: Joi.date().format("DD-MM-YYYY"),
    toDate: Joi.date().format("DD-MM-YYYY"),
    mealType: Joi.array().items(Joi.string().required()).required(),
    outletId: Joi.number().required(),
  }),
};
