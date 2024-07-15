import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import * as DbModels from "../models";
import { env } from "../../../server/config";
import { Log } from "../../context/Logs";
import { Loglevel } from "../../context";
import { getGuid } from "../../context/service";
import * as dbConfig from "../config/config.json";

const envDbConfig = dbConfig[env as keyof typeof dbConfig] as SequelizeOptions;

export const getSequelize = async (): Promise<Sequelize> => {
  const DbModelsList: { [key: string]: any } = DbModels;
  const listOfModels: any = [];
  const keys: string[] = Object.keys(DbModels);
  keys.map((singleModel) => {
    listOfModels.push(DbModelsList[singleModel as string]);
  });

  //Add Db Models
  envDbConfig.models = listOfModels;

  try {
    const sequelize = new Sequelize({
      ...envDbConfig,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
    await sequelize.authenticate();
    return sequelize;
  } catch (error) {
    console.log("[GetSequelize] - connection error", error);
    Log.writeLog(
      Loglevel.ERROR,
      "getSequelize",
      "Connection Error",
      error,
      getGuid()
    );
    process.exit(-1);
  }
};
