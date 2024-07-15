import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const CreateNotesPayload = {
  body: Joi.object({
    description: Joi.string().required(),
    noteLevel: Joi.string().required(),
  }),
};

export const UpdateNotesPayload = {
  body: Joi.object({
    description: Joi.string().required(),
    noteLevel: Joi.string().required(),
  }),
};

export const FilterOutletNotesPayload = {
  body: Joi.object({
    date: Joi.date().format("DD-MM-YYYY"),
  }),
};
