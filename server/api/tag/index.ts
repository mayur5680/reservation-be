import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  CreateTagPayload,
  UpdateTagPayload,
  CreateOutletTagPayload,
  UpdateOutletTagPayload,
  TrimData,
} from "../../validation";
import {
  createTag,
  getAllTag,
  getTagByCategory,
  updateTag,
  deleteTag,
  createOutletTag,
  getAllOutletTag,
  updateOutletTag,
  deleteOutletTag,
  getTagByCategoryByoutletComapny,
} from "./controller";

const route = express.Router();

route.post(
  "/outlet/:outletId",
  validateAuthorization,
  validate(CreateTagPayload, {}, {}),
  TrimData,
  createTag
);

route.get(
  "/tagCategory/:tagCategoryId/:outletId/:companyId",
  getTagByCategoryByoutletComapny
);

route.get("/tagCategory/:tagCategoryId", getTagByCategory);

route.get("/outlet/:outletId", validateAuthorization, getAllTag);

route.put(
  "/:tagId/outlet/:outletId",
  validateAuthorization,
  validate(UpdateTagPayload, {}, {}),
  TrimData,
  updateTag
);

route.delete("/:tagId/outlet/:outletId", validateAuthorization, deleteTag);

//OutletTag

route.post(
  "/outlettag/outlet/:outletId",
  validateAuthorization,
  validate(CreateOutletTagPayload, {}, {}),
  createOutletTag
);

route.get("/outlettag/outlet/:id", validateAuthorization, getAllOutletTag);

route.put(
  "/outlettag/:outlettagId/outlet/:outletId",
  validateAuthorization,
  validate(UpdateOutletTagPayload, {}, {}),
  updateOutletTag
);

route.delete(
  "/outlettag/:outlettagId/outlet/:outletId",
  validateAuthorization,
  deleteOutletTag
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
