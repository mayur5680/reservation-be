import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const GetTimelineViewPayload = {
  body: Joi.object({
    date: Joi.date().format("DD-MM-YYYY"),
    mealType: Joi.string().allow(null, ""),
  }),
};

export const MoveReservationPayload = {
  body: Joi.object({
    outletTableBookingId: Joi.number().required(),
    toOutleTableId: Joi.number().required(),
    date: Joi.date().format("DD-MM-YYYY").required(),
    time: Joi.string().required(),
  }),
};
