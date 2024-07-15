import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const GetAvailibleTableForPrivateEvent = {
  body: Joi.object({
    noOfAdult: Joi.number().min(1).required(),
    noOfChild: Joi.number().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    outletSeatingTypeId: Joi.number().required(),
    startDate: Joi.date().format("DD-MM-YYYY").required(),
    endDate: Joi.date().format("DD-MM-YYYY").required(),
  }),
};

export const NewPrivateEventPayload = {
  noOfPerson: "string",
  startTime: "string",
  endTime: "string",
  startDate: "string",
  endDate: "string",
  name: "string",
  lastName: "string",
  email: "string",
  mobileNo: "string",
  bookingType: "string",
  specialRequest: "string",
  reservationNotes: "string",
  outletTables: "string",
  image: "string",
};
