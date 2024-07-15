import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  BookTicketPayload,
  TrimData,
  GetTicketTimeSlotPayload,
} from "../../validation";
import { getTimeSlot, bookTicket } from "./controller";

const route = express.Router();

route.post(
  "/:ticketId/reservation",
  validate(BookTicketPayload, {}, {}),
  TrimData,
  bookTicket
);

route.post(
  "/:ticketId/timeslot",
  validate(GetTicketTimeSlotPayload, {}, {}),
  getTimeSlot
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
