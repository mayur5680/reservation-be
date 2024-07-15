const { Joi } = require("express-validation");

export const CreateCompanyPayload = {
  name: "string",
  contentLanguage: "string",
  image: "string",
};

export const UpdateCompanyPayload = {
  name: "string",
  contentLanguage: "string",
  isActive: "string",
};

export const UpdateCompanyMailChimpPayload = {
  body: Joi.object({
    mailChimpPublicKey: Joi.string().allow(null, ""),
    mailChimpPrivateKey: Joi.string().allow(null, ""),
    tags: Joi.array()
      .items({
        id: Joi.number().required(),
        name: Joi.string().required(),
      })
      .allow(null, ""),
    mailChimpStatus: Joi.boolean().allow(null),
    marketingId: Joi.number().allow(null, ""),
    mailChimpUserName: Joi.string().allow(null, ""),
    twilioAccountSid: Joi.string().allow(null, ""),
    twilioAuthToken: Joi.string().allow(null, ""),
    twilioMessagingServiceSid: Joi.string().allow(null, ""),
  }),
};

export const UpdateCompanyIvrsPayload = {
  body: Joi.object({
    ivrsUserKey: Joi.string().allow(null, ""),
    ivrsSecretKey: Joi.string().allow(null, ""),
  }),
};
