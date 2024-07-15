import { Sequelize } from "sequelize";
import { OutletUserDbInterface, UserDbInterface } from "../../db-interfaces";
import { Loglevel, Actions } from "../../context";
import { Log } from "../../context/Logs";

export const userDeletion = async (
  userId: number,
  uniqueId: string,
  sequelize: Sequelize
): Promise<void> => {
  try {
    const outletuserDbInterface = new OutletUserDbInterface(sequelize);
    const userDbInterface = new UserDbInterface(sequelize);
    
    //check if user is access of another outlet
    const checkUser = await outletuserDbInterface.getOutletUserByUserId(userId);

    if (!checkUser) {
      await userDbInterface.deleteUserById(userId);
      Log.writeLog(
        Loglevel.INFO,
        "userDeletion",
        Actions.DELETED,
        `User ${userId} is Soft Deleted from Db`,
        uniqueId
      );
    }
  } catch (error) {
    throw error;
  }
};

export const getUserOutlets = async (
  userId: number,
  sequelize: Sequelize
): Promise<Number[]> => {
  try {
    const outletuserDbInterface = new OutletUserDbInterface(sequelize);

    let outletIds: number[] = [];

    const outletUsers = await outletuserDbInterface.getAllOutletByUserId(
      userId
    );

    if (outletUsers.length > 0) {
      outletIds = outletUsers.map((outletUser) => outletUser.outletId);
    }

    return outletIds;
  } catch (error) {
    throw error;
  }
};
