const { Joi } = require("express-validation");

export const userPermissionPayload = {
  body: Joi.array()
    .items(
      Joi.object({
        moduleName: Joi.string().required(),
        isCreate: Joi.boolean().required(),
        isRead: Joi.boolean().required(),
        isUpdate: Joi.boolean().required(),
        isDelete: Joi.boolean().required(),
      })
    )
    .required(),
};

export const UpdatePermissionPayload = {
  body: Joi.object({
    permission: Joi.array()
      .items(
        Joi.object({
          moduleName: Joi.string().required(),
          isCreate: Joi.boolean().required().allow(null),
          isRead: Joi.boolean().required().allow(null),
          isUpdate: Joi.boolean().required().allow(null),
          isDelete: Joi.boolean().required().allow(null),
        })
      )
      .required(),
  }),
};
