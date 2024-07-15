import * as express from "express";
import { validate, ValidationError } from "express-validation";
import {
  createUser,
  getUsers,
  getUsersByCompanyId,
  updateUser,
  deleteUser,
  createSupeAdmin,
  getAllSuperUser,
  updateSupeAdmin,
  deleteSuperAdmin,
} from "./controller";
import { validateAuthorization } from "../../@authorization";
import {
  CreateUser,
  UpdateUser,
  CreateSuperAdmin,
  UpdateSuperAdmin,
} from "../../validation";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";

const route = express.Router();
route.post(
  "/",
  validateAuthorization,
  validate(CreateUser, {}, {}),
  createUser
);
route.get("/outlet/:outletid", validateAuthorization, getUsers);

route.get("/company/:companyId", validateAuthorization, getUsersByCompanyId);


route.put(
  "/:userId/outlet/:outletId",
  validateAuthorization,
  validate(UpdateUser, {}, {}),
  updateUser
);
route.delete("/:userId/outlet/:outletId", validateAuthorization, deleteUser);

//Super Admin
route.post(
  "/superAdmin",
  validateAuthorization,
  validate(CreateSuperAdmin, {}, {}),
  createSupeAdmin
);

route.get("/superAdmin", validateAuthorization, getAllSuperUser);
route.put(
  "/superAdmin/:id",
  validateAuthorization,
  validate(UpdateSuperAdmin, {}, {}),
  updateSupeAdmin
);
route.delete("/superAdmin/:id", validateAuthorization, deleteSuperAdmin);

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
