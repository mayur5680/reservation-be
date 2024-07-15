import { Marketing } from "../../db/interface";
import { CompanyDbModel, MarketingDbModel } from "../../db/models";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { Loglevel, StatusCode } from "../../context";
import { Log } from "../../context/Logs";
import { CustomerPayload } from "../../@types/marketing";
import { MailChimpServerName } from "../shared";
const moduleName = "MailChimp";

const mailchimp = require("@mailchimp/mailchimp_marketing");

export const createMailChimpList = async (
  marketing: Marketing,
  company: CompanyDbModel,
  uniqueId: string
) => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "createMailChimpList",
      marketing,
      uniqueId
    );

    mailchimp.setConfig({
      apiKey: company.mailChimpPublicKey,
      server: await MailChimpServerName(company.mailChimpPublicKey),
    });

    const data = {
      name: marketing.name,
      permission_reminder: "permission_reminder",
      email_type_option: true,
      contact: {
        company: company.name,
        address1: "61 Mount Sinai Drive",
        city: "Singapore",
        country: "SG",
        state: "state",
        zip: "zip",
      },
      campaign_defaults: {
        from_name: "Hui Shi",
        from_email: company.mailChimpUserName,
        subject: "subject",
        language: "language",
      },
    };

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "createMailChimpList",
      data,
      uniqueId
    );

    const response = await mailchimp.lists.createList(data);

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "createMailChimpList",
      response,
      uniqueId
    );

    return response;
  } catch (error: any) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "createMailChimpList",
      error,
      uniqueId
    );

    let errorMessage = "";

    if (error.response) {
      const mailChimpError = JSON.parse(error.response.text);
      errorMessage = mailChimpError.title;
    } else {
      const e = error as Error;
      errorMessage = e.message;
    }

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: errorMessage,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export async function addMemberToList(
  customers: CustomerPayload[],
  marketing: MarketingDbModel,
  company: CompanyDbModel,
  uniqueId: string
) {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "addMemberToList",
      customers,
      uniqueId
    );

    mailchimp.setConfig({
      apiKey: company.mailChimpPublicKey,
      server: await MailChimpServerName(company.mailChimpPublicKey),
    });

    const customerList = customers.map((customer) => {
      const merge_fields: any = {
        FNAME: customer.name,
        LNAME: customer.lastName,
        ADDRESS: {
          addr1: customer.address ? customer.address : "",
          city: customer.address ? customer.address : "",
          state: customer.address ? customer.address : "",
          zip: customer.postalCode ? customer.postalCode : "",
        },
      };
      merge_fields[marketing.mergerField] = customer.outletName;

      return {
        email_address: customer.email,
        merge_fields,
        status: "subscribed",
      };
    });

    try {
      const response = await mailchimp.lists.batchListMembers(
        marketing.mailchimpListId,
        {
          members: customerList,
          //skip_duplicate_check: true,
          update_existing: false,
        }
      );

      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        "addMemberToList",
        response,
        uniqueId
      );
    } catch (error) {
      Log.writeLog(
        Loglevel.ERROR,
        moduleName,
        "addMemberToList",
        error,
        uniqueId
      );
    }
  } catch (error: any) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "addMemberToList",
      error,
      uniqueId
    );

    let errorMessage = "";

    if (error.response) {
      const mailChimpError = JSON.parse(error.response.text);
      errorMessage = mailChimpError.title;
    } else {
      const e = error as Error;
      errorMessage = e.message;
    }

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: errorMessage,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
}

export async function getListDetails(
  marketing: MarketingDbModel,
  company: CompanyDbModel,
  uniqueId: string
) {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getListDetails",
      marketing,
      uniqueId
    );

    mailchimp.setConfig({
      apiKey: company.mailChimpPublicKey,
      server: await MailChimpServerName(company.mailChimpPublicKey),
    });

    const response = await mailchimp.lists.getListMembersInfo(
      marketing.mailchimpListId,
      {
        count: 1000,
      }
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getListDetails",
      response,
      uniqueId
    );

    return response;
  } catch (error: any) {
    Log.writeLog(Loglevel.ERROR, moduleName, "getListDetails", error, uniqueId);
    let errorMessage = "";

    if (error.response) {
      const mailChimpError = JSON.parse(error.response.text);
      errorMessage = mailChimpError.title;
    } else {
      const e = error as Error;
      errorMessage = e.message;
    }

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: errorMessage,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
}

export async function deleteList(
  marketing: MarketingDbModel,
  company: CompanyDbModel,
  uniqueId: string
) {
  try {
    Log.writeLog(Loglevel.INFO, moduleName, "deleteList", marketing, uniqueId);

    mailchimp.setConfig({
      apiKey: company.mailChimpPublicKey,
      server: await MailChimpServerName(company.mailChimpPublicKey),
    });

    const response = await mailchimp.lists.deleteList(
      marketing.mailchimpListId
    );

    Log.writeLog(Loglevel.INFO, moduleName, "deleteList", response, uniqueId);

    return response;
  } catch (error: any) {
    Log.writeLog(Loglevel.ERROR, moduleName, "deleteList", error, uniqueId);
    let errorMessage = "";

    if (error.response) {
      const mailChimpError = JSON.parse(error.response.text);
      errorMessage = mailChimpError.title;
    } else {
      const e = error as Error;
      errorMessage = e.message;
    }

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: errorMessage,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
}

export async function creatMergeField(
  listId: string,
  company: CompanyDbModel,
  uniqueId: string
) {
  try {
    Log.writeLog(Loglevel.INFO, moduleName, "creatMergeList", listId, uniqueId);

    mailchimp.setConfig({
      apiKey: company.mailChimpPublicKey,
      server: await MailChimpServerName(company.mailChimpPublicKey),
    });

    const response = await mailchimp.lists.addListMergeField(listId, {
      name: "Outlet",
      type: "text",
    });

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatMergeList",
      response,
      uniqueId
    );

    return response;
  } catch (error: any) {
    Log.writeLog(Loglevel.ERROR, moduleName, "creatMergeList", error, uniqueId);
    let errorMessage = "";

    if (error.response) {
      const mailChimpError = JSON.parse(error.response.text);
      errorMessage = mailChimpError.title;
    } else {
      const e = error as Error;
      errorMessage = e.message;
    }

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: errorMessage,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
}
