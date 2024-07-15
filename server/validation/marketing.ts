const { Joi } = require("express-validation");

export const CreateMarketingPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    tags: Joi.array().allow(null, ""),
    criteria: Joi.array().items({
      fieldName: Joi.string().required(),
      criteria: Joi.string().required(),
      value: Joi.alternatives(
        Joi.string().required(),
        Joi.object().keys({
          value1: Joi.string().required(),
          value2: Joi.string().required(),
          displayValue1: Joi.string().allow(null, ""),
          displayValue2: Joi.string().allow(null, ""),
        })
      ).required(),
      displayName: Joi.string().allow(null, ""),
      displayCriteria: Joi.string().allow(null, ""),
      displayValue: Joi.string().allow(null, ""),
    }),
  }),
};

export const UpdateMarketingPayload = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
    tags: Joi.array()
      .items({
        id: Joi.number().required(),
        name: Joi.string().required(),
      })
      .allow(null, ""),
    criteria: Joi.array().items({
      fieldName: Joi.string().required(),
      criteria: Joi.string().required(),
      value: Joi.alternatives(
        Joi.string().required(),
        Joi.object().keys({
          value1: Joi.string().required(),
          value2: Joi.string().required(),
          displayValue1: Joi.string().allow(null, ""),
          displayValue2: Joi.string().allow(null, ""),
        })
      ).required(),
      displayName: Joi.string().allow(null, ""),
      displayCriteria: Joi.string().allow(null, ""),
      displayValue: Joi.string().allow(null, ""),
    }),
    isActive: Joi.boolean().required(),
  }),
};
