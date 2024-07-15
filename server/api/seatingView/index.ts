import * as express from "express";
import { ValidationError, validate } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  GetSeatingViewPayload,
  NewBookingPayload,
  UpdateSeatingViewStatusPayload,
  MoveTableReservationPayload,
  TrimData,
} from "../../validation";
import {
  getSeatingView,
  updateStatus,
  newReservationBooking,
  moveTableBooking,
} from "./controller";

const route = express.Router();

//New Reservation
route.post(
  "/reservation/outlet/:id",
  validateAuthorization,
  validate(NewBookingPayload, {}, {}),
  TrimData,
  newReservationBooking
);

//Move booking
route.put(
  "/move/outlet/:id",
  validateAuthorization,
  validate(MoveTableReservationPayload, {}, {}),
  moveTableBooking
);

//Update Status
route.put(
  "/outlet/:id",
  validateAuthorization,
  validate(UpdateSeatingViewStatusPayload, {}, {}),
  updateStatus
);

//Get SeatingView
route.post(
  "/outlet/:id",
  validateAuthorization,
  validate(GetSeatingViewPayload, {}, {}),
  getSeatingView
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
