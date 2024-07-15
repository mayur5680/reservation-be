import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  TrimData,
  UpdateCompanyMailChimpPayload,
  UpdateCompanyIvrsPayload,
} from "../../validation";
import {
  createCompany,
  getCompanies,
  updateComapny,
  deleteCompany,
  getCompanyBykey,
  getUserCompany,
  updateComapnyMailChimp,
  updateComapnyIvrs,
  upload,
} from "./controller";

const route = express.Router();

route.post("/", validateAuthorization, upload, TrimData, createCompany);

route.get("/user", validateAuthorization, getUserCompany);

route.get("/:key", getCompanyBykey);
route.get("/", getCompanies);

route.put(
  "/:companyId/mailchimp",
  validateAuthorization,
  validate(UpdateCompanyMailChimpPayload, {}, {}),
  TrimData,
  updateComapnyMailChimp
);

route.put(
  "/:companyId/ivrs",
  validateAuthorization,
  validate(UpdateCompanyIvrsPayload, {}, {}),
  TrimData,
  updateComapnyIvrs
);

route.put(
  "/:companyId",
  validateAuthorization,
  upload,
  TrimData,
  updateComapny
);

route.delete("/:companyId", validateAuthorization, deleteCompany);

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
