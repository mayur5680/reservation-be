import * as express from "express";
import { ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import { TrimData } from "../../validation";
import {
  createTicketing,
  getAllTicketing,
  updateTicketing,
  deleteTicketing,
  getAllTicketingByCompanyKey,
  upload,
} from "./controller";

const route = express.Router();

route.post(
  "/outlet/:outletId",
  validateAuthorization,
  upload,
  TrimData,
  createTicketing
);

route.post("/filter/outlet/:outletId", getAllTicketing);

route.put(
  "/:ticketId/outlet/:outletId",
  validateAuthorization,
  upload,
  TrimData,
  updateTicketing
);

route.delete(
  "/:ticketId/outlet/:outletId",
  validateAuthorization,
  deleteTicketing
);

route.get("/comapny/:key", getAllTicketingByCompanyKey);

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
