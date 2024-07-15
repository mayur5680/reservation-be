import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import { TrimData, FilterMaterialPayload } from "../../validation";
import {
  createMaterials,
  getAllMaterials,
  updateMaterials,
  deleteMaterials,
  getMaterial,
  upload,
} from "./controller";

const route = express.Router();

//create Material
route.post(
  "/outlet/:outletId",
  validateAuthorization,
  upload,
  TrimData,
  createMaterials
);

//get all Materials
route.post(
  "/filter/outlet/:outletId",
  validateAuthorization,
  validate(FilterMaterialPayload, {}, {}),
  getAllMaterials
);

//get Material by id
route.get("/:materialId", validateAuthorization, getMaterial);

//update Material
route.put(
  "/:materialId",
  validateAuthorization,
  upload,
  TrimData,
  updateMaterials
);

//delete Material
route.delete("/:materialId", validateAuthorization, deleteMaterials);

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
