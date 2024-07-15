import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { logFile } from "../config";
import { LogStatus, LogTypes, Loglevel } from "./";
import { writeLog } from "./service";
import { Sequelize } from "sequelize";
import { OutletDbModel, UserDbModel } from "server/db/models";

export class Log {
  static Log: any;

  constructor() {
    console.log("Log Successfully Initialized");
  }

  /* Init stackify object and logger objects */
  static logInit() {
    let filePath = logFile.filePath;
    console.log("Log path", filePath);

    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4,
    };
    const colors = {
      error: "red",
      warn: "yellow",
      info: "green",
      http: "magenta",
      debug: "white",
      silly: "blue",
    };

    winston.addColors(colors);

    const format = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: [${info.message}]`
      )
    );

    const fileRotateTransport = new DailyRotateFile({
      dirname: logFile.filePath,
      filename: "log-%DATE%.log",
      datePattern: "YYYY-MM-DD-HH",
      maxSize: "20m",
      maxFiles: "14d",
    });

    this.Log = winston.createLogger({
      level: Loglevel.INFO,
      levels,
      format,
      transports: [fileRotateTransport, new winston.transports.Console()],
    });
  }

  /* Write log to file and/or stackify */
  static writeLog(
    level: Loglevel,
    moduleName: string,
    actiontype: string,
    message: any,
    uniqueId: string
  ) {
    this.Log.log(
      level,
      `[${uniqueId}] [${moduleName}][${actiontype}] ${JSON.stringify(
        message?.message ? message.message.toString() : message,
        null,
        3
      )}`
    );
  }

  static writeExitLog(
    level: Loglevel,
    methodName: string,
    actiontype: string,
    message: any,
    response: any,
    uniqueId: string,
    sequelize: Sequelize,
    type = LogTypes.SYSTEM_LOG,
    user: UserDbModel,
    outlet: OutletDbModel | null = null,
    contentChange: string | null = null,
    isIgnore: Boolean | null = true
  ) {
    this.Log.log(
      level,
      `[${uniqueId}] [${methodName}][${actiontype}][Request] ${JSON.stringify(
        message,
        null,
        3
      )} `
    );
    if (level === Loglevel.ERROR) {
      if (isIgnore)
        writeLog({
          type: type,
          action: actiontype,
          module: methodName,
          user,
          outlet,
          sequelize,
          status: LogStatus.FAIL,
          requestData: JSON.stringify(message, null, 3),
          responseData: JSON.stringify(
            response?.message ? response.message.toString() : response,
            null,
            3
          ),
        });
      this.Log.log(
        level,
        `[${uniqueId}] [${methodName}][${actiontype}][Error] ${JSON.stringify(
          response?.message ? response.message.toString() : response,
          null,
          3
        )}`
      );
    } else {
      if (isIgnore)
        writeLog({
          type: type,
          action: actiontype,
          module: methodName,
          user,
          outlet,
          sequelize,
          status: LogStatus.SUCCESS,
          contentChange: contentChange,
          requestData: JSON.stringify(message, null, 3),
          responseData: JSON.stringify(response, null, 3),
        });
      this.Log.log(
        level,
        `[${uniqueId}] [${methodName}][${actiontype}][Response] ${JSON.stringify(
          response,
          null,
          3
        )} `
      );
    }
  }
}
