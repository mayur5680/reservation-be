import express, { NextFunction, Response } from "express";
import AllRoutes from "./routes";
import * as bodyparser from "body-parser";
import { Sequelize } from "sequelize-typescript";
import { getSequelize } from "../server/db/connection";
import { port, env } from "./config";
import {
  cronJobForDltVerfication,
  cronJobForEmailSending,
  cronJobForSMSSending,
  cronJobForAutoTagging,
  cronJobForReadMailChope,
  cronJobForIVRS,
  cronJobForRestart,
} from "./api/cronJob";
import { imageLocation, ivrsLocation } from "./config";
import { Log } from "./context/Logs";
import { errorResponse, Loglevel, StatusCode } from "./context";
import { getGuid, sendMail } from "./context/service";
import { Exceptions } from "./exception";

var morgan = require("morgan");
var cors = require("cors");
const swaggerUi = require("swagger-ui-express");
import swaggerDocument from "../swagger.json";
// const swaggerAutogen = require("swagger-autogen")();

const app = express();

app.use(cors());
app.use(bodyparser.urlencoded({ limit: "200mb", extended: true }));
app.use(bodyparser.json({ limit: "200mb" }));
app.use(bodyparser.json({ type: "application/*+json" }));
Log.logInit();

let dbConnection: Sequelize;

getSequelize().then((res: Sequelize | undefined) => {
  if (res === undefined) {
    Log.writeLog(
      Loglevel.ERROR,
      "getSequelize",
      "Connection Error",
      "Connection Not Establish",
      getGuid()
    );
    process.exit(0);
  }
  dbConnection = res;
});

app.use("/images", express.static(imageLocation.itemFilePath));
app.use("/images", express.static(imageLocation.floorFilePath));
app.use("/images", express.static(imageLocation.tableFilePath));
app.use("/images", express.static(imageLocation.outletFilePath));
app.use("/images", express.static(imageLocation.materialFilePath));
app.use("/images", express.static(imageLocation.diningoptionFilePath));
app.use("/images", express.static(imageLocation.ticketingFilePath));
app.use("/images", express.static(imageLocation.invoiceFilePath));
app.use("/images", express.static(imageLocation.templateFilePath));
app.use("/images", express.static(imageLocation.companyFilePath));
app.use("/audio", express.static(ivrsLocation.recordingFilePath));

app.use(async (req: any, res: Response, next: NextFunction) => {
  if (dbConnection) {
    req.sequelize = dbConnection;
  } else {
    return errorResponse(
      Exceptions.INVALID_CONFIG,
      StatusCode.SERVER_ERROR,
      res,
      Exceptions.INVALID_CONFIG
    );
  }
  next();
});

//Cron Jobs
cronJobForDltVerfication();
cronJobForEmailSending();
cronJobForSMSSending();
cronJobForIVRS();
cronJobForAutoTagging();
cronJobForReadMailChope();
cronJobForRestart();

app.use(morgan("dev"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

AllRoutes(app);

process.on("uncaughtException", async function (err) {
  Log.writeLog(
    Loglevel.ERROR,
    "uncaughtException",
    "SystemBreaks",
    err,
    getGuid()
  );
  await sendMail(
    "shielam@theadventus.com",
    "CreatE System is down please restart it",
    dbConnection,
    getGuid(),
    "Urgent",
    null,
    "CreatE-Reservation",
    null,
    null,
    null,
    null,
    [
      "marketing@createries.com",
      "abigail.camaya@createries.com",
      "huishi@theadventus.com",
      "yuit@theadventus.com",
      "kim@theadventus.com",
      "11mscit074@gmail.com",
    ]
  );

  process.exit(0);
});

app.listen(port, () => {
  Log.writeLog(
    Loglevel.INFO,
    "Application",
    "Starting",
    `API [${env}] Is Running On http://locahost:${port}`,
    getGuid()
  );
});
