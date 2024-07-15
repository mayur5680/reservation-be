import * as fs from "fs";
import { ivrsLocation } from "../../config";
import { IvrsVoiceCall } from "../../db/interface";
import {
  IvrsDetailDbInterface,
  IvrsVoiceCallDbInterface,
} from "../../db-interfaces";
import { Sequelize } from "sequelize";
import { Log } from "../../context/Logs";
import { IvrsCustomerDial, Loglevel } from "../../context";
//import { twilioVoiceApi } from "../twilio";
let moment = require("moment-timezone");
const moduleName = "Link-IVRS";

const path = ivrsLocation.recordingFilePath;

export const saveIvrsVoiceCall = async (
  sequelize: Sequelize,
  uniqueId: string
): Promise<void> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "saveIvrsVoiceCall",
      path,
      uniqueId
    );

    const ivrsVoiceCallPayload: IvrsVoiceCall[] = [];
    fs.readdir(path, async (err, files) => {
      //handling error
      if (err) {
        Log.writeLog(
          Loglevel.ERROR,
          moduleName,
          "saveIvrsVoiceCall",
          err,
          uniqueId
        );
      }

      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        "saveIvrsVoiceCall",
        files,
        uniqueId
      );

      //listing all files using forEach
      files.forEach(function (file) {
        // Do whatever you want to do with the file
        const result = splitFileName(file);
        if (result) {
          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "saveIvrsVoiceCall",
            result,
            uniqueId
          );
          ivrsVoiceCallPayload.push(result);
        }
      });

      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        "saveIvrsVoiceCall",
        ivrsVoiceCallPayload,
        uniqueId
      );

      const ivrsDetailDbInterface = new IvrsVoiceCallDbInterface(sequelize);
      await ivrsDetailDbInterface.create(ivrsVoiceCallPayload, uniqueId);
    });
  } catch (error) {
    throw error;
  }
};

const splitFileName = (paths: string): IvrsVoiceCall | null => {
  try {
    const split = paths.split("-");

    let phoneNo: string = "";
    let time: string = "";
    if (split.length >= 2) {
      let splitNumber = split[0].replace(/[<"">\ \s-]+/g, " ").split(" ");
      phoneNo = splitNumber[1];
      const splitTime = split[1].split(".wav");
      time = splitTime[0];
    }
    const ivrsDetail: IvrsVoiceCall = {
      fromPhoneNo: "+" + phoneNo,
      path: "audio/" + paths,
      time: moment.tz(time, "dddd, MMMM DD, YYYY at, hh:mm:ss a", "UTC"),
    };

    //if condition
    const startTime = moment()
      .tz("Asia/Singapore")
      .subtract(2, "days")
      .startOf("day");
    if (startTime.isBefore(ivrsDetail.time)) {
      return ivrsDetail;
    }

    return null;
  } catch (error) {
    throw error;
  }
};

export const linkVoiceCallToIvrs = async (
  sequelize: Sequelize,
  uniqueId: string
) => {
  try {
    const ivrsDetailDbInterface = new IvrsDetailDbInterface(sequelize);
    const ivrsVoiceCallDbInterface = new IvrsVoiceCallDbInterface(sequelize);

    const getUnlinkRecord = await ivrsVoiceCallDbInterface.getUnlinkCall();
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "linkVoiceCallToIvrs",
      getUnlinkRecord,
      uniqueId
    );

    if (getUnlinkRecord.length > 0) {
      await Promise.all(
        getUnlinkRecord.map(async (record) => {
          const result = await ivrsDetailDbInterface.getLinkCall(record);
          if (result) {
            record.IvrsDetailId = result.id;
            record.isLink = true;
            await record.save();

            //update IvtsDetials
            const pressedDigit = IvrsCustomerDial[2];

            const customerPressDigit = result.pressedDigit
              ? JSON.parse(result.pressedDigit)
              : [];

            customerPressDigit.push(pressedDigit);
            result.pressedDigit = JSON.stringify(customerPressDigit);

            result.is_recorded = true;
            await result.save();
          }
        })
      );
    }
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "linkVoiceCallToIvrs",
      error,
      uniqueId
    );
    throw error;
  }
};
