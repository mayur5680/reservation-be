import { Response, NextFunction } from "express";
import { sequelizeValidate } from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  Loglevel,
  LogTypes,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { getGuid } from "../../context/service";
import { Marketing } from "../../db/interface";
import {
  UserDbInterface,
  MarketingDbInterface,
  CompanyDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import {
  addMemberToList,
  creatMergeField,
  createMailChimpList,
  deleteList,
} from "../mailChimp";
import { CriteriaPayload, CustomerPayload } from "../../@types/marketing";
import {
  customerMarketingCriteria,
  getAdminUser,
  getUpdateBy,
  nameValidation,
} from "../shared";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { uniqBy } from "lodash";
import { UpdateCompanyMailChimpPayload } from "../../@types/company";

const moduleName = "Marketing";

export const createMarketing = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

    const userId = decoded.userDetail.id;
    const companyId = params.companyId;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "User Found",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const company = await companyDbInterface.getComapnyById(companyId, false);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "Company Found",
      uniqueId
    );

    if (!company.mailChimpPublicKey) {
      throw new ApiError({
        message: Exceptions.INVALID_MAILCHIMP_KEY,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const marketing: Marketing = body;
    const marketingDbInterface = new MarketingDbInterface(sequelize);

    //Check Name Validation
    await nameValidation(marketingDbInterface.repository, {
      name: marketing.name,
    });

    const mailChimpResponse = await createMailChimpList(
      marketing,
      company,
      uniqueId
    );

    //create MergerField in MailChimp
    const mergerFieldName = await creatMergeField(
      mailChimpResponse.id,
      company,
      uniqueId
    );

    marketing.mailchimpListId = mailChimpResponse.id;
    marketing.tags = JSON.stringify(marketing.tags);
    marketing.mergerField = mergerFieldName.tag;

    marketing.criteria = JSON.stringify(marketing.criteria);

    const createMarketing = (
      await marketingDbInterface.create(marketing, user.id)
    ).toJSON();

    const response = {
      ...createMarketing,
      updatedBy: getUpdateBy(user),
      tags: JSON.parse(createMarketing.tags),
      criteria: JSON.parse(createMarketing.criteria),
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      body,
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.CREATED).send(
      new ApiResponse({
        message: "Marketing Created Successfully",
        data: response,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.CREATED,
      body,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

//Get All Marketing
export const getAllMarketing = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, body, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      { params, body },
      uniqueId
    );

    const userId = decoded.userDetail.id;
    const companyId = params.companyId;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "User Found",
      uniqueId
    );

    const marketingDbInterface = new MarketingDbInterface(sequelize);
    const marketings = (await marketingDbInterface.getAllMarketing()).map(
      (marketing) => {
        return {
          ...marketing,
          tags: JSON.parse(marketing.tags),
          criteria: JSON.parse(marketing.criteria),
        };
      }
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      marketings,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: marketings,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
      params,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

//Update Market By Id
export const updateMarketing = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, body, decoded, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.UPDATED, body, uniqueId);
    const { marketingId, companyId } = params;

    const userId = decoded.userDetail.id;

    const marketingPayload: Marketing = body;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "User Found",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const company = await companyDbInterface.getComapnyById(companyId, false);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Company Found",
      uniqueId
    );

    const marketingDbInterface = new MarketingDbInterface(sequelize);
    const marketing = await marketingDbInterface.getMarketingById(
      marketingId,
      false
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      "Marketing Found",
      uniqueId
    );

    //check name validation
    if (marketing.name != marketingPayload.name) {
      await nameValidation(marketingDbInterface.repository, {
        name: marketingPayload.name,
      });
    }

    marketingPayload.tags = JSON.stringify(marketingPayload.tags);
    marketingPayload.criteria = JSON.stringify(marketingPayload.criteria);

    const updatedMarketing = (
      await marketingDbInterface.update(marketing.id, marketingPayload, user.id)
    ).toJSON();

    const response = {
      ...updatedMarketing,
      tags: JSON.parse(updatedMarketing.tags),
      criteria: JSON.parse(updatedMarketing.criteria),
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Marketing Updated Successfully",
        data: response,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.UPDATED,
      body,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

//Delete Marketing By Id
export const deleteMarketing = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.DELETED, params, uniqueId);
    const { marketingId } = params;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "User Found",
      uniqueId
    );

    const marketingDbInterface = new MarketingDbInterface(sequelize);
    const marketing = await marketingDbInterface.getMarketingById(
      marketingId,
      false
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "Marketing Found",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const company = await companyDbInterface.findOneCompany();
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "Company Found",
      uniqueId
    );

    const deletedMarketing = await marketingDbInterface.delete(
      marketingId,
      user.id
    );

    if (company) {
      //Delete list in MailChimp
      await deleteList(marketing, company, uniqueId);
    }

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      params,
      deletedMarketing,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Marketing Deleted Successfully",
        data: deletedMarketing.id,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.DELETED,
      params,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

//sync data to mailchimp
export const syncDataToMailChimp = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params, body, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "syncDataToMailChimp",
      { params, body },
      uniqueId
    );

    const userId = decoded.userDetail.id;

    const { marketingId, companyId } = params;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "syncDataToMailChimp",
      "User Found",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const company = await companyDbInterface.getComapnyById(companyId, false);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "syncDataToMailChimp",
      "Company Found",
      uniqueId
    );

    if (!company.mailChimpPublicKey) {
      throw new ApiError({
        message: Exceptions.INVALID_MAILCHIMP_KEY,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    const marketingDbInterface = new MarketingDbInterface(sequelize);
    let marketing = (
      await marketingDbInterface.getMarketingById(marketingId)
    ).toJSON();
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "syncDataToMailChimp",
      "Marketing Found",
      uniqueId
    );

    const companyPayload: UpdateCompanyMailChimpPayload = {
      marketingId: marketing.id,
    };

    await companyDbInterface.updateCompanyMailChimp(
      companyPayload,
      company.id,
      user.id
    );

    marketing = {
      ...marketing,
      tags: JSON.parse(marketing.tags),
      criteria: JSON.parse(marketing.criteria),
    };

    const criteriaPayload: CriteriaPayload[] = marketing.criteria;

    const customers = await customerMarketingCriteria(
      criteriaPayload,
      uniqueId,
      sequelize
    );

    let membersList: CustomerPayload[] = uniqBy(customers, "email");

    await addMemberToList(membersList, marketing, company, uniqueId);

    const response = {
      ...company.toJSON(),
      tags: JSON.parse(company.tags),
    };

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      criteriaPayload,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Sync Contact Successfully",
        data: response,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
      params,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};

//Customer List
export const getCustomerList = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);
    const { marketingId } = params;

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "User Found",
      uniqueId
    );

    const marketingDbInterface = new MarketingDbInterface(sequelize);
    let marketing = (
      await marketingDbInterface.getMarketingById(marketingId, false)
    ).toJSON();

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "Marketing Found",
      uniqueId
    );

    marketing = {
      ...marketing,
      tags: JSON.parse(marketing.tags),
      criteria: JSON.parse(marketing.criteria),
    };

    const criteriaPayload: CriteriaPayload[] = marketing.criteria;

    const customers = (
      await customerMarketingCriteria(criteriaPayload, uniqueId, sequelize)
    ).map((customer) => {
      return {
        ...customer,
        tags: customer.tags ? JSON.parse(customer.tags) : null,
      };
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      customers,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: customers,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
      params,
      error,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return catchErrorResponse(error, res);
  }
};
