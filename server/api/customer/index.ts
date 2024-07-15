import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  UpdateCustomerPayload,
  FilterCustomerReservationPayload,
  FilterCustomerByCompanyPayload,
  TrimData,
} from "../../validation";
import {
  getAllCustomers,
  getCustomersReservation,
  getCustomerProfile,
  updateCustomer,
} from "./controller";

const route = express.Router();

//Update Customer
route.put(
  "/:customerId/outlet/:outletId",
  validateAuthorization,
  validate(UpdateCustomerPayload, {}, {}),
  TrimData,
  updateCustomer
);

//Get Customers Reservation
route.post(
  "/:customerId/reservation/outlet/:outletId",
  validateAuthorization,
  validate(FilterCustomerReservationPayload, {}, {}),
  getCustomersReservation
);

//Get Customers Profile
route.get(
  "/:customerId/profile/outlet/:outletId",
  validateAuthorization,
  getCustomerProfile
);

//Get All Customers
route.post(
  "/company",
  validateAuthorization,
  validate(FilterCustomerByCompanyPayload, {}, {}),
  getAllCustomers
);

route.use((err: unknown, req: any, res: any, next: any) => {
  let result = "";
  if (err instanceof ValidationError) {
    const error = err as ValidationError;
    result += error.details.body?.map((data) => data.message);
    const searchRegExp = new RegExp('"', "g");
    const errorMessage = result.toString().replace(searchRegExp, "");
    return res.status(err.statusCode).json(
      new ApiError({
        message: errorMessage,
        devMessage: errorMessage,
        statusCode: StatusCode.BAD_REQUEST,
      })
    );
  }
  return res.status(500).json(err);
});

export default route;
