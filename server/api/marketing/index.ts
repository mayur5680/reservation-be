import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  TrimData,
  CreateMarketingPayload,
  UpdateMarketingPayload,
} from "../../validation";
import {
  createMarketing,
  getAllMarketing,
  updateMarketing,
  deleteMarketing,
  syncDataToMailChimp,
  getCustomerList,
} from "./controller";

const route = express.Router();

//create Marketing
route.post(
  "/company/:companyId",
  validateAuthorization,
  validate(CreateMarketingPayload, {}, {}),
  TrimData,
  createMarketing
);

//get all Marketing
route.get("/company/:companyId", validateAuthorization, getAllMarketing);

//update Marketing
route.put(
  "/:marketingId/company/:companyId",
  validateAuthorization,
  validate(UpdateMarketingPayload, {}, {}),
  TrimData,
  updateMarketing
);

//delete Marketing
route.delete("/:marketingId", validateAuthorization, deleteMarketing);

//sync data to mailchimp
route.post(
  "/:marketingId/syncdata/company/:companyId",
  validateAuthorization,
  syncDataToMailChimp
);

//customer list data to mailchimp
route.get("/:marketingId/customerlist", validateAuthorization, getCustomerList);

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
  const e = err as Error;
  return res.status(StatusCode.SERVER_ERROR).json(
    new ApiError({
      message: e.message,
      devMessage: e.message,
      statusCode: StatusCode.SERVER_ERROR,
    })
  );
});

export default route;
