import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  CreateNotesPayload,
  UpdateNotesPayload,
  FilterOutletNotesPayload,
} from "../../validation";
import {
  createNotes,
  getAllNotes,
  updateNotes,
  deleteNotes,
} from "./controller";

const route = express.Router();

route.post(
  "/outlet/:outletId",
  validateAuthorization,
  validate(CreateNotesPayload, {}, {}),
  createNotes
);

route.post(
  "/filter/outlet/:outletId",
  validateAuthorization,
  validate(FilterOutletNotesPayload, {}, {}),
  getAllNotes
);

route.put(
  "/:outletNoteId/outlet/:outletId",
  validateAuthorization,
  validate(UpdateNotesPayload, {}, {}),
  updateNotes
);

route.delete(
  "/:outletNoteId/outlet/:outletId",
  validateAuthorization,
  deleteNotes
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
