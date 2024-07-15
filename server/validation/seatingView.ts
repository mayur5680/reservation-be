import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const GetSeatingViewPayload = {
  body: Joi.object({
    outletSeatingTypeId: Joi.number().required(),
    date: Joi.date().format("DD-MM-YYYY"),
    mealType: Joi.string().allow(null, ""),
  }),
};

export const UpdateSeatingViewStatusPayload = {
  body: Joi.object({
    outletTableBookingId: Joi.number().required(),
    status: Joi.string().required(),
    date: Joi.date().format("DD-MM-YYYY"),
    mealType: Joi.string().allow(null, ""),
  }),
};

export const MoveTableReservationPayload = {
  body: Joi.object({
    outletTableBookingId: Joi.number().required(),
    toOutleTableId: Joi.number().required(),
    date: Joi.date().format("DD-MM-YYYY"),
    mealType: Joi.string().allow(null, ""),
    outletSeatingTypeId: Joi.number(),
  }),
};
