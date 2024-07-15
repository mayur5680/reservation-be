const { Joi } = require("express-validation");
export const loginPayload = {
  body: Joi.object({
    userName: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

export const forgetpasswordPayload = {
  body: Joi.object({
    userName: Joi.string().required(),
    type: Joi.string().required(),
  }),
};

export const verifyCodePayload = {
  body: Joi.object({
    verificationToken: Joi.string().required(),
    code: Joi.string().required(),
  }),
};

export const resetpasswordPayload = {
  body: Joi.object({
    password: Joi.string().required(),
    confirmPassword: Joi.any().valid(Joi.ref("password")).required(),
  }),
};
