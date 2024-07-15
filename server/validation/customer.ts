import { Joi as coreJoi } from "express-validation";
import { CustomerReservation } from "../context";
const Joi = coreJoi.extend(require("@joi/date"));

export const UpdateCustomerPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    mobileNo: Joi.string()
      .empty(/\s+/)
      .trim()
      .regex(/([+]?\d{1,2}[.-\s]?)?(\d{3}[.-]?){2}\d{4}/)
      .messages({ "string.pattern.base": `Mobile number is not valid.` })
      .max(15)
      .required(),
    lastName: Joi.string(),
    salutation: Joi.string().allow(null, ""),
    customerCompanyName: Joi.string().allow(null, ""),
    gender: Joi.string().allow(null, ""),
    dob: Joi.date().format("DD-MM-YYYY").allow(null, ""),
    age: Joi.number().allow(null, ""),
    address: Joi.string().allow(null, ""),
    postalCode: Joi.string().allow(null, ""),
    programName: Joi.string().allow(null, ""),
    activationTerminal: Joi.string().allow(null, ""),
    tags: Joi.array()
      .items({
        id: Joi.number().required(),
        name: Joi.string().required(),
      })
      .allow(null, ""),
    notes: Joi.string().allow(null, ""),
    eatPoints: Joi.number().allow(null, ""),
    noOfRefferalSignUp: Joi.number().allow(null, ""),
    noOfRefferalPurchased: Joi.number().allow(null, ""),
  }),
};

export const FilterCustomerByCompanyPayload = {
  body: Joi.object({
    companyIds: Joi.array().items(Joi.number().min(1).required()).required(),
    filter: Joi.string()
      .valid(
        CustomerReservation.ALL,
        CustomerReservation.UPCOMING,
        CustomerReservation.PAST
      )
      .allow(null, ""),
  }),
};

export const FilterCustomerReservationPayload = {
  body: Joi.object({
    filter: Joi.string()
      .valid(
        CustomerReservation.ALL,
        CustomerReservation.UPCOMING,
        CustomerReservation.PAST
      )
      .allow(null, ""),
  }),
};
