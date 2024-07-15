import * as express from "express";
import { validate, ValidationError } from "express-validation";
import {
  getUserOutlets,
  createOutlet,
  deleteOutlet,
  updateOutlet,
  getOutlet,
  upload,
} from "./controller";
import { validateAuthorization } from "../../@authorization";
import { TrimData } from "../../validation";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";

const route = express.Router();

route.get("/:id", validateAuthorization, getOutlet);
route.get("/", validateAuthorization, getUserOutlets);
route.post(
  "/",
  validateAuthorization,
  upload,
  TrimData,
  createOutlet
);
route.delete("/:id", validateAuthorization, deleteOutlet);
route.put(
  "/:id",
  validateAuthorization,
  upload,
  TrimData,
  updateOutlet
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
