import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  CreateSeatingTypePayload,
  UpdateSeatingTypePayload,
} from "../../validation";
import {
  getAllSeatingType,
  createSeatingType,
  updateSeatingType,
  deleteSeatingType,
} from "./controller";

const route = express.Router();

route.get("/outlet/:id", validateAuthorization, getAllSeatingType);

route.post(
  "/outlet/:outletId",
  validateAuthorization,
  validate(CreateSeatingTypePayload, {}, {}),
  createSeatingType
);

route.put(
  "/:seatingTypeId/outlet/:outletId",
  validateAuthorization,
  validate(UpdateSeatingTypePayload, {}, {}),
  updateSeatingType
);

route.delete(
  "/:seatingTypeId/outlet/:outletId",
  validateAuthorization,
  deleteSeatingType
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
