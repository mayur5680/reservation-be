import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { CreateRolePayload, UpdateRolePayload } from "../../validation";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import { createRole, getAllRoles, updateRole, deleteRole } from "./controller";

const route = express.Router();

route.post(
  "/outlet/:outletId",
  validateAuthorization,
  validate(CreateRolePayload, {}, {}),
  createRole
);
route.get("/outlet/:id", validateAuthorization, getAllRoles);
route.put(
  "/:roleId/outlet/:outletId",
  validateAuthorization,
  validate(UpdateRolePayload, {}, {}),
  updateRole
);
route.delete("/:roleId/outlet/:outletId", validateAuthorization, deleteRole);

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
