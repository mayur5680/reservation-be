const { Joi } = require("express-validation");

export const CreateOutletPayloadd = {
  name: "string",
  address1: "string",
  postcode: "string",
  latitude: "string",
  longitude: "string",
  phone: "string",
  email: "string",
  googlePlaceId: "string",
  gst: "string",
  rebookingTableInterval: "string",
  timeSlotInterval: "string",
  timezone: "string",
};

export const UpdateOutletPayloadd = {
  name: "string",
  address1: "string",
  postcode: "string",
  latitude: "string",
  longitude: "string",
  phone: "string",
  email: "string",
  googlePlaceId: "string",
  gst: "string",
  rebookingTableInterval: "string",
  timeSlotInterval: "string",
  timezone: "string",
  isActive: "string",
};
