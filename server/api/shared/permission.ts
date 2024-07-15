import { Sequelize } from "sequelize";
import { OutletDbModel, UserDbModel } from "../../db/models";
import {
  OutletUserDbInterface,
  UserPermissionDbInterface,
} from "../../db-interfaces";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { StatusCode } from "../../context";

export const checkPermission = async (
  user: UserDbModel,
  outlet: OutletDbModel,
  moduleName: string,
  action: string,
  sequelize: Sequelize
): Promise<void> => {
  const outletuserDbInterface = new OutletUserDbInterface(sequelize);
  const userPermissionDbInterface = new UserPermissionDbInterface(sequelize);
  let getPermission = null;

  if (!user.roleId) {
    let outletUser =
      await outletuserDbInterface.getOutletUserByOutelIdAndUserId(
        user.id,
        outlet.id
      );

    getPermission = (
      await userPermissionDbInterface.getPermissionByRoleId(
        outletUser.roleId
      )
    ).toJSON();
  } else {
    getPermission = (
      await userPermissionDbInterface.getPermissionByRoleId(
        user.roleId
      )
    ).toJSON();
  }

  getPermission = {
    ...getPermission,
    permission: JSON.parse(getPermission.permission),
  };

  const data = getPermission.permission.find(
    (d: any) => d.moduleName === moduleName
  );

  if (data[action] === false) {
    throw new ApiError({
      message: Exceptions.UNAUTHORIZED_ACCESS,
      statusCode: StatusCode.UNAUTHORIZED,
    });
  }
};
