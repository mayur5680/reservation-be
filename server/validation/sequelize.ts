import { Exceptions } from "../exception";
import { errorResponse, StatusCode } from "../context";

export const sequelizeValidate = (sequelize: any, res: any) => {
  if (sequelize === undefined)
    return errorResponse(
      Exceptions.INVALID_CONFIG,
      StatusCode.SERVER_ERROR,
      res
    );
};
