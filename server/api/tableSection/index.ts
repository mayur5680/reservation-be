import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import { CreateTableSectionPayload, TrimData } from "../../validation";
import {
  createTableSection,
  updateTableSection,
  getAllTableSection,
  deleteTableSection,
  upload,
  createPrivateTableSection,
  getAllPrivateTableSection,
} from "./controller";

const route = express.Router();

route.post(
  "/seatingtype/:outletSeatingTypeId",
  validateAuthorization,
  validate(CreateTableSectionPayload, {}, {}),
  TrimData,
  createTableSection
);

route.get(
  "/private/outlet/:outletId",
  validateAuthorization,
  getAllPrivateTableSection
);

route.get(
  "/seatingtype/:outletSeatingTypeId",
  validateAuthorization,
  getAllTableSection
);

route.put(
  "/private/:tablesectionId/seatingtype/:outletSeatingTypeId",
  validateAuthorization,
  upload,
  TrimData,
  updateTableSection
);

route.delete("/:tablesectionId", validateAuthorization, deleteTableSection);

//Create Private Group table
route.post(
  "/private/seatingtype/:outletSeatingTypeId",
  validateAuthorization,
  upload,
  createPrivateTableSection
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
