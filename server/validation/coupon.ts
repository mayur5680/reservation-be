import { Joi as coreJoi } from "express-validation";
const Joi = coreJoi.extend(require("@joi/date"));

export const CreateCouponPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    startDate: Joi.date().format("DD-MM-YYYY").required(),
    endDate: Joi.date().format("DD-MM-YYYY").required(),
    openingTime: Joi.string().required(),
    closingTime: Joi.string().required(),
    discountAmount: Joi.number().required(),
    noOfPerson: Joi.number().min(1).required(),
    repeatOn: Joi.array().items(Joi.string().allow(null, "")),
    tc: Joi.string(),
  }),
};

export const UpdateCouponPayload = {
  body: Joi.object({
    name: Joi.string(),
    startDate: Joi.date().format("DD-MM-YYYY").required(),
    endDate: Joi.date().format("DD-MM-YYYY").required(),
    openingTime: Joi.string().required(),
    closingTime: Joi.string().required(),
    discountAmount: Joi.number().required(),
    noOfPerson: Joi.number().min(1).required(),
    repeatOn: Joi.array().items(Joi.string().allow(null, "")),
    tc: Joi.string(),
    isCampaignActive: Joi.boolean().required(),
  }),
};

export const GetCouponPayload = {
  body: Joi.object({
    fromDate: Joi.date().format("DD-MM-YYYY"),
    toDate: Joi.date().format("DD-MM-YYYY"),
  }),
};
