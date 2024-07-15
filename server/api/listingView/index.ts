import * as express from "express";
import { ValidationError, validate } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  GetAvailibleTable,
  NewBookingPayload,
  TrimData,
  GetAvailibleTableForPrivateEvent,
} from "../../validation";
import {
  getAvalibleTables,
  newReservationBooking,
  getAvalibleTablesForPrivateEvent,
  privateEventBooking,
  upload,
} from "./controller";

const route = express.Router();

route.post(
  "/reservation/outlet/:id",
  validateAuthorization,
  validate(NewBookingPayload, {}, {}),
  TrimData,
  newReservationBooking
);

route.post(
  "/outlet/:id",
  validateAuthorization,
  validate(GetAvailibleTable, {}, {}),
  getAvalibleTables
);

route.post(
  "/private/outlet/:id",
  validateAuthorization,
  validate(GetAvailibleTableForPrivateEvent, {}, {}),
  getAvalibleTablesForPrivateEvent
);

route.post(
  "/private/reservation/outlet/:id",
  validateAuthorization,
  upload,
  privateEventBooking
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
