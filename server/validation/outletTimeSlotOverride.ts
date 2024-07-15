import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const CreateOverrideTimeSlot = {
  body: Joi.object({
    sectionId: Joi.number().required(),
    dayofweek: Joi.number().required(),
    effectiveFrom: Joi.date().format("DD-MM-YYYY").required(),
    effectiveTo: Joi.date().format("DD-MM-YYYY").required(),
    openingTime: Joi.string(),
    closingTime: Joi.string(),
    reason: Joi.string().required(),
    outletStatus: Joi.boolean().required(),
  }),
};

export const UpdateOverrideTimeSlot = {
  body: Joi.object({
    sectionId: Joi.number().required(),
    dayofweek: Joi.number().required(),
    effectiveFrom: Joi.date().format("DD-MM-YYYY").required(),
    effectiveTo: Joi.date().format("DD-MM-YYYY").required(),
    openingTime: Joi.string().allow(null),
    closingTime: Joi.string().allow(null),
    reason: Joi.string().required(),
    outletStatus: Joi.boolean().required(),
    isActive: Joi.boolean().required(),
  }),
};
