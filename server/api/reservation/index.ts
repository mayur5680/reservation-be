import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  BookTablePayload,
  GetOutletTimeSlotPayload,
  TrimData,
  step4Payload,
} from "../../validation";
import {
  getAllOutlet,
  bookTable,
  step2,
  step4,
  stripeWebhook,
  retriveInvoiceBySession,
} from "./controller";

const route = express.Router();

route.post(
  "/outlet/:id/booking",
  validate(BookTablePayload, {}, {}),
  TrimData,
  bookTable
);

route.get("/session/:sessionId", retriveInvoiceBySession);

route.post("/stripe", stripeWebhook);

route.post("/step2/:key", validate(GetOutletTimeSlotPayload, {}, {}), step2);

route.post("/step4/outlet/:outletId", validate(step4Payload, {}, {}), step4);

route.get("/outlet", getAllOutlet);

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
