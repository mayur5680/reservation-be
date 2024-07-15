import * as express from "express";
import { ValidationError, validate } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  GetTimelineViewPayload,
  MoveReservationPayload,
} from "../../validation";
import { getTimelineView, getMealTiming, moveReservation } from "./controller";

const route = express.Router();

route.post(
  "/outlet/:id/mealtime",
  validateAuthorization,
  validate(GetTimelineViewPayload, {}, {}),
  getMealTiming
);

//Move booking
route.put(
  "/move/outlet/:id",
  validateAuthorization,
  validate(MoveReservationPayload, {}, {}),
  moveReservation
);

//Get TimeLineView
route.post(
  "/outlet/:id",
  validateAuthorization,
  validate(GetTimelineViewPayload, {}, {}),
  getTimelineView
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
