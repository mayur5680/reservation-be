import * as express from "express";
import { ValidationError, validate } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import { GetAllSectionsByCompanyIdsPayload, TrimData } from "../../validation";
import {
  createPreOrderItem,
  upload,
  getAllPreOrderItem,
  updatePreOrderItem,
  deletePreOrderItem,
  getAllPreOrderItemByCompanyId,
} from "./controller";

const route = express.Router();

route.post(
  "/outlet/:outletId",
  validateAuthorization,
  upload,
  TrimData,
  createPreOrderItem
);

route.get("/outlet/:outletId", validateAuthorization, getAllPreOrderItem);

route.post(
  "/company",
  validateAuthorization,
  validate(GetAllSectionsByCompanyIdsPayload, {}, {}),
  getAllPreOrderItemByCompanyId
);

route.put(
  "/:preOrderItemId/outlet/:outletId",
  validateAuthorization,
  upload,
  TrimData,
  updatePreOrderItem
);

route.delete(
  "/:preOrderItemId/outlet/:outletId",
  validateAuthorization,
  deletePreOrderItem
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
