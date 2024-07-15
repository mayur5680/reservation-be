import * as express from "express";
import { ValidationError, validate } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  ReservationReportPayload,
  CustomerReportPayload,
  GroupEventReportPayload,
  SingleEventReportPayload,
} from "../../validation";
import {
  getReservationReport,
  getCustomerReport,
  getGroupEventReport,
  getSingleEventReport,
} from "./controller";

const route = express.Router();

//New Reservation
route.post(
  "/reservation",
  validateAuthorization,
  validate(ReservationReportPayload, {}, {}),
  getReservationReport
);

route.post(
  "/customer",
  validateAuthorization,
  validate(CustomerReportPayload, {}, {}),
  getCustomerReport
);

route.post(
  "/event/group",
  validateAuthorization,
  validate(GroupEventReportPayload, {}, {}),
  getGroupEventReport
);

route.post(
  "/event/single",
  validateAuthorization,
  validate(SingleEventReportPayload, {}, {}),
  getSingleEventReport
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
