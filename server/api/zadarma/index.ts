import { Log } from "../../context/Logs";
import { zadama } from "../../config/index";
import { Loglevel } from "../../context";
import { ZadarmaIncomingResponse } from "../../@types/ivrsDetails";
import { CompanyDbModel } from "../../db/models";
const { api: z_api } = require("zadarma");
const moduleName = "Zadarma";

export const getIVRSDetails = async () => {
  try {
    const apiPayload = {
      http_method: "GET",
      api_method: "/v1/statistics/pbx/",
      api_user_key: zadama.userKey,
      api_secret_key: zadama.secretKey,
      params: {
        start: "2023-03-31 19:00:00",
        end: "2023-04-13 12:04:44",
        version: 2,
      },
    };

    let response = await z_api(apiPayload);
  } catch (error) {
    throw error;
  }
};

export const getCallRecording = async () => {
  try {
    const apiPayload = {
      http_method: "GET",
      api_method: "/v1/pbx/redirection/",
      api_user_key: zadama.userKey,
      api_secret_key: zadama.secretKey,
      params: {
        //call_id: "1681122253.124044",
        pbx_call_id: "in_cce44bbc9d1ac5a2dc91112115d915404ed63259",
      },
    };

    let response = await z_api(apiPayload);
  } catch (error) {
    throw error;
  }
};

export const staticIVRS = async (
  fromDate: string,
  toDate: string,
  company: CompanyDbModel,
  uniqueId: string
): Promise<ZadarmaIncomingResponse> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "staticIVRS",
      { fromDate, toDate },
      uniqueId
    );

    const apiPayload = {
      http_method: "GET",
      api_method: "/v1/statistics/pbx/",
      api_user_key: company.ivrsUserKey,
      api_secret_key: company.ivrsSecretKey,
      params: {
        start: fromDate,
        end: toDate,
        version: 2,
      },
    };
    Log.writeLog(Loglevel.INFO, moduleName, "apiPayload", apiPayload, uniqueId);

    let response = await z_api(apiPayload);

    Log.writeLog(Loglevel.INFO, moduleName, "staticIVRS", response, uniqueId);

    return response;
  } catch (error) {
    Log.writeLog(Loglevel.INFO, moduleName, "staticIVRS", error, uniqueId);

    throw error;
  }
};
