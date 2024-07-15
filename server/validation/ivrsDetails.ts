import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const IvrsPayload = {
  body: Joi.object({
    fromDate: Joi.date().format("DD-MM-YYYY"),
    toDate: Joi.date().format("DD-MM-YYYY"),
  }),
};

export const UpdateIvrsPayload = {
  body: Joi.object({
    isDone: Joi.boolean().required(),
    tags: Joi.array()
      .items({
        id: Joi.number().required(),
        name: Joi.string().required(),
      })
      .allow(null, ""),
    notes: Joi.string().allow(null, ""),
  }),
};
