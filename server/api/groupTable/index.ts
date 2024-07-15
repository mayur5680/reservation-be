import * as express from "express";
import { validate, ValidationError } from "express-validation";
import { validateAuthorization } from "../../@authorization";
import { ApiError } from "../../@types/apiError";
import { StatusCode } from "../../context";
import {
  createGroupTable,
  getAllGroupTable,
  deleteGroupTable,
  AddPossibiltes,
  DeletePossibiltes,
  updateGroupTable,
} from "./controller";
import {
  CreateGroupPayload,
  AddPossibilityPayload,
  UpdateGroupPayload,
} from "../../validation";

const route = express.Router();

//Delete Group table
route.delete(
  "/seatingtype/:outletSeatingTypeId/grouptable/:groupTableId",
  validateAuthorization,
  deleteGroupTable
);

//Update Group table
route.put(
  "/seatingtype/:outletSeatingTypeId/grouptable/:groupTableId",
  validateAuthorization,
  validate(UpdateGroupPayload, {}, {}),
  updateGroupTable
);

//Create Group table
route.post(
  "/seatingtype/:outletSeatingTypeId",
  validateAuthorization,
  validate(CreateGroupPayload, {}, {}),
  createGroupTable
);

//GetAll Group table
route.get(
  "/seatingtype/:outletSeatingTypeId",
  validateAuthorization,
  getAllGroupTable
);

//Add Possibilites
route.post(
  "/seatingtype/:outletSeatingTypeId/grouptable/:groupTableId",
  validateAuthorization,
  validate(AddPossibilityPayload, {}, {}),
  AddPossibiltes
);

//Delete Possibilites
route.delete(
  "/seatingtype/:outletSeatingTypeId/grouptable/:groupTableId/possibility/:groupPossibilityId",
  validateAuthorization,
  DeletePossibiltes
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
