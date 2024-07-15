import * as express from "express";
import { ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import { TrimData } from "../../validation";
import {
  createOutletTable,
  getAllOutletTable,
  updateOutletTable,
  deleteOutletTable,
  updateOutletTablePosition,
  upload,
  getAllOutletTableForPrivate,
} from "./controller";

const route = express.Router();

route.post(
  "/seatingtype/:outletSeatingTypeId",
  validateAuthorization,
  upload,
  TrimData,
  createOutletTable
);

route.get(
  "/private/seatingtype/:outletSeatingTypeId",
  validateAuthorization,
  getAllOutletTableForPrivate
);
route.get(
  "/seatingtype/:outletSeatingTypeId",
  validateAuthorization,
  getAllOutletTable
);

route.put(
  "/:outlettableId",
  validateAuthorization,
  upload,
  TrimData,
  updateOutletTable
);

route.delete("/:outlettableId", validateAuthorization, deleteOutletTable);

route.put(
  "/seatingtype/:outletSeatingTypeId",
  validateAuthorization,
  updateOutletTablePosition
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
