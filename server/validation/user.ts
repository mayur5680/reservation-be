const { Joi } = require("express-validation");

export const CreateUser = {
  body: Joi.object({
    email: Joi.string().required(),
    roleId: Joi.number().required(),
    outletId: Joi.number().required(),
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
      .allow(null),
  }),
};

export const UpdateUser = {
  body: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.string().required(),
    roleId: Joi.number().required(),
    isActive: Joi.boolean().required(),
    companyPermission: Joi.object({
      id: Joi.number().required(),
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
    }).required(),
  }),
};

export const CreateSuperAdmin = {
  body: Joi.object({
    email: Joi.string().required(),
  }),
};

export const UpdateSuperAdmin = {
  body: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.string().required(),
    isActive: Joi.boolean().required(),
  }),
};
