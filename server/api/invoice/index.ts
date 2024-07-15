import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  UpdateInvoicePayload,
  FilterInvoicePayload,
  UpdateInvoiceForMail,
} from "../../validation";
import {
  getInvoice,
  getInvoiceByFilter,
  updateInvoiveStatus,
  updateStatusByMail,
  chargeAmountFromInvoice,
} from "./controller";

const route = express.Router();

route.post(
  "/outlet/:id/:isfuture",
  validateAuthorization,
  validate(FilterInvoicePayload, {}, {}),
  getInvoiceByFilter
);
route.get("/:id", getInvoice);

//Update Status in mail
route.get("/:invoiceId/status/:status", updateStatusByMail);

//Update Invoice
route.put(
  "/:id",
  validateAuthorization,
  validate(UpdateInvoicePayload, {}, {}),
  updateInvoiveStatus
);

//Charge Amount
route.put("/:id/charge", validateAuthorization, chargeAmountFromInvoice);

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
