import * as express from "express";
import { ValidationError, validate } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import { UpdatePermissionPayload } from "../../validation";
import {
  create,
  getPermission,
  Update,
  getUserPermission,
  getAllPermission,
} from "./controller";

const route = express.Router();

route.post("/outlet/:outletId/role/:roleId", validateAuthorization, create);

route.put(
  "/:permissionId/outlet/:outletId",
  validateAuthorization,
  validate(UpdatePermissionPayload, {}, {}),
  Update
);

route.get(
  "/outlet/:outletId/role/:roleId",
  validateAuthorization,
  getPermission
);

route.get("/outlet/:outletId", validateAuthorization, getUserPermission);

route.get("/allpermission", validateAuthorization, getAllPermission);

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
