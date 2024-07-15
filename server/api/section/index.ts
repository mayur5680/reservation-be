import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  CreateSectionPayload,
  UpdateSectionPayload,
  GetAllSectionsByCompanyIdsPayload,
} from "../../validation";
import {
  createSection,
  getAllSection,
  updateSection,
  deleteSection,
  getAllSectionByCompanyId,
} from "./controller";

const route = express.Router();

route.post(
  "/outlet/:outletId",
  validateAuthorization,
  validate(CreateSectionPayload, {}, {}),
  createSection
);

route.post(
  "/company",
  validateAuthorization,
  validate(GetAllSectionsByCompanyIdsPayload, {}, {}),
  getAllSectionByCompanyId
);

route.get("/outlet/:id", validateAuthorization, getAllSection);

route.put(
  "/:sectionId/outlet/:outletId",
  validateAuthorization,
  validate(UpdateSectionPayload, {}, {}),
  updateSection
);

route.delete(
  "/:sectionId/outlet/:outletId",
  validateAuthorization,
  deleteSection
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
