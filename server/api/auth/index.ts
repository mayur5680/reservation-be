import * as express from "express";
import { validate, ValidationError } from "express-validation";
import {
  login,
  forgetPassword,
  verifiyCode,
  resetPassword,
} from "./controller";
import {
  loginPayload,
  forgetpasswordPayload,
  verifyCodePayload,
  resetpasswordPayload,
} from "../../validation";
import { ApiError } from "../../@types/apiError";
import { validateAuthorization } from "../../@authorization";
import { StatusCode } from "../../context";

const route = express.Router();

route.post("/", validate(loginPayload, {}, {}), login);
route.post(
  "/forgetPassword",
  validate(forgetpasswordPayload, {}, {}),
  forgetPassword
);
route.put("/verifyCode", validate(verifyCodePayload, {}, {}), verifiyCode);
route.put(
  "/resetPassword",
  validateAuthorization,
  validate(resetpasswordPayload, {}, {}),
  resetPassword
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
