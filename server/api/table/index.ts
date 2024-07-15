import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { CreateTablePayload, UpdateTablePayload } from "../../validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  createTable,
  getAllTable,
  updateTable,
  deleteTable,
} from "./controller";

const route = express.Router();

route.post(
  "/outlet/:outletId",
  validateAuthorization,
  validate(CreateTablePayload, {}, {}),
  createTable
);

route.get("/outlet/:outletId", validateAuthorization, getAllTable);

route.put(
  "/:tableId/outlet/:outletId",
  validateAuthorization,
  validate(UpdateTablePayload, {}, {}),
  updateTable
);

route.delete("/:tableId/outlet/:outletId", validateAuthorization, deleteTable);

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
  return res.status(500).json({ demo: "demo", err });
});

export default route;
