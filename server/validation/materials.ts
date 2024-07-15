const { Joi } = require("express-validation");
export const CreateMaterialPayload = {
  title: "string",
  attachment: "string",
  thumbnail: "string",
  categoryId: "string",
  subCategoryId: "string",
};

export const UpdateMaterialPayload = {
  title: "string",
  categoryId: "string",
  subCategoryId: "string",
};

export const FilterMaterialPayload = {
  body: Joi.object({
    search: Joi.string().allow(null, ""),
    categoryId: Joi.number().allow(null, ""),
    subCategoryId: Joi.number().allow(null, ""),
  }),
};
