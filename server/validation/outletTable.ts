const { Joi } = require("express-validation");

export const CreateOutletTablePayloadd = {
  name: "string",
  tableId: "string",
  xPosition: "string",
  yPosition: "string",
};

export const UpdateOutletTablePayloadd = {
  name: "string",
  tableId: "string",
  xPosition: "string",
  yPosition: "string",
  isActive: "string",
};
