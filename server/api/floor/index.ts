import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  createFloor,
  getAllFloor,
  upload,
  updateFloor,
  deleteFloor,
} from "./controller";

const route = express.Router();

route.post("/outlet/:outletId", validateAuthorization, upload, createFloor);

route.get("/outlet/:outletId", validateAuthorization, getAllFloor);

route.put(
  "/:floorId/outlet/:outletId",
  validateAuthorization,
  upload,
  updateFloor
);

route.delete("/:floorId/outlet/:outletId", validateAuthorization, deleteFloor);

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
  return res.status(500).json({ demo: "demo", err });
});

export default route;
