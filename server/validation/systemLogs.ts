import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const FilterSystemLogsPayload = {
  body: Joi.object({
    date: Joi.date().format("DD-MM-YYYY"),
  }),
};

export const SystemLogsPayload = {
  body: Joi.object({
    fromDate: Joi.date().format("DD-MM-YYYY"),
    toDate: Joi.date().format("DD-MM-YYYY"),
  }),
};
