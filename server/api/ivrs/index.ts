import * as express from "express";
import { ValidationError, validate } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  createIvrsDetials,
  updateIvrsDetails,
  getCallerInfo,
  DIDWWCallBack,
  PBXCallBack,
} from "./controller";
import { IvrsPayload, UpdateIvrsPayload } from "../../validation";

const route = express.Router();

route.post(
  "/outlet/:outletId",
  validateAuthorization,
  validate(IvrsPayload, {}, {}),
  createIvrsDetials
);

route.put(
  "/:ivrsId",
  validateAuthorization,
  validate(UpdateIvrsPayload, {}, {}),
  updateIvrsDetails
);

route.post("/didww", DIDWWCallBack);
route.get("/voice/outlet/:To/customer/:From/:Digit", PBXCallBack);

route.get("/:ivrsId", validateAuthorization, getCallerInfo);

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
