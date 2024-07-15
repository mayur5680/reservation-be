import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  CreateOverrideTimeSlot,
  UpdateOverrideTimeSlot,
} from "../../validation";
import {
  createOverideTimeSlot,
  getAllTimeSlotOverride,
  updateTimeSlotOverride,
  deleteTimeSlotOverride,
} from "./controller";

const route = express.Router();

route.post(
  "/outlet/:outletId",
  validateAuthorization,
  validate(CreateOverrideTimeSlot, {}, {}),
  createOverideTimeSlot
);
route.get("/outlet/:id", validateAuthorization, getAllTimeSlotOverride);

route.put(
  "/:timeslotId/outlet/:outletId",
  validateAuthorization,
  validate(UpdateOverrideTimeSlot, {}, {}),
  updateTimeSlotOverride
);

route.delete(
  "/:timeslotId/outlet/:outletId",
  validateAuthorization,
  deleteTimeSlotOverride
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
