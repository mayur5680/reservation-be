import { Response, NextFunction } from "express";
import multer from "multer";
import {
  CreateCompanyPayload,
  UpdateCompanyPayload,
  sequelizeValidate,
} from "../../validation";
import {
  catchErrorResponse,
  StatusCode,
  Actions,
  Loglevel,
  LogTypes,
} from "../../context";
import { ApiResponse } from "../../@types/apiSuccess";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { getGuid } from "../../context/service";
import { Company } from "../../db/interface";
import {
  CompanyDbInterface,
  MarketingDbInterface,
  OutletDbInterface,
  UserDbInterface,
} from "../../db-interfaces";
import { Log } from "../../context/Logs";
import { CompanyDbModel } from "../../db/models";
import {
  UpdateCompanyIvrsPayload,
  UpdateCompanyMailChimpPayload,
} from "../../@types/company";
import {
  getAdminUser,
  getUpdateBy,
  nameValidation,
  payloadValidation,
} from "../shared";
import { flatten, max, min } from "lodash";
import { imageLocation } from "../../config";

const moduleName = "Company";

//File Upload
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageLocation.companyFilePath);
  },
  filename: (req, file, cb) => {
    const getExtension = file.originalname.toString().split(".")[1];
    cb(null, getGuid() + "." + getExtension); //Appending .jpg
  },
});

export const upload = multer({
  storage: fileStorageEngine,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
}).single("image");

export const createCompany = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded, body } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.CREATED, body, uniqueId);

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.CREATED,
      "User Found",
      uniqueId
    );

    if (!user.roleId) {
      throw new ApiError({
        message: Exceptions.UNAUTHORIZED_ACCESS,
        statusCode: StatusCode.UNAUTHORIZED,
      });
    }

    const company: Company = body;

    const companyDbInterface = new CompanyDbInterface(sequelize);

    //Check Name is already Exists
    await nameValidation(companyDbInterface.repository, {
      name: company.name,
    });

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.companyFilePath, "images/")
        .replace(/\s/g, "");

      company.image = image;
    }

    payloadValidation(CreateCompanyPayload, company);

    const findOneCompany = await companyDbInterface.findOneCompany();

    if (findOneCompany) {
      company.mailChimpPublicKey = findOneCompany.mailChimpPublicKey;
      company.mailChimpPrivateKey = findOneCompany.mailChimpPrivateKey;
      company.tags = findOneCompany.tags;
      company.mailChimpStatus = findOneCompany.mailChimpStatus;
      company.marketingId = findOneCompany.marketingId;
      company.mailChimpUserName = findOneCompany.mailChimpUserName;
      company.twilioAccountSid = findOneCompany.twilioAccountSid;
      company.twilioAuthToken = findOneCompany.twilioAuthToken;
      company.twilioMessagingServiceSid =
        findOneCompany.twilioMessagingServiceSid;
    }

    const createCompany = await companyDbInterface.create(company, userId);

    const response = {
      ...createCompany.toJSON(),
      updatedBy: getUpdateBy(user),
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
        message: "Brand Created Successfully",
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

export const getCompanies = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "ALLCompanies",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const getCompany = await companyDbInterface.getAllcompany(true);

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "ALLCompanies",
      getCompany,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: getCompany,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
      "ALLCompanies",
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

export const updateComapny = async (
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
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      { body, params },
      uniqueId
    );
    const { companyId } = params;

    const userId = decoded.userDetail.id;
    const companyPayload: Company = body;

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

    if (!user.roleId) {
      throw new ApiError({
        message: Exceptions.UNAUTHORIZED_ACCESS,
        statusCode: StatusCode.UNAUTHORIZED,
      });
    }

    //Check Name already exists
    if (company.name !== companyPayload.name) {
      await nameValidation(companyDbInterface.repository, {
        name: companyPayload.name,
      });
    }

    if (req.file) {
      const image = req.file.path
        .replace(imageLocation.companyFilePath, "images/")
        .replace(/\s/g, "");

      companyPayload.image = image;
    }

    payloadValidation(UpdateCompanyPayload, companyPayload);

    const updatedComapny = await companyDbInterface.updateCompany(
      companyPayload,
      company.id,
      user.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updatedComapny,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Brand Updated Successfully",
        data: updatedComapny,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.UPDATED,
      { body, params },
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

export const deleteCompany = async (
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
    const { companyId } = params;

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

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const company = await companyDbInterface.getComapnyById(companyId, false);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      "Company Found",
      uniqueId
    );

    if (!user.roleId) {
      throw new ApiError({
        message: Exceptions.UNAUTHORIZED_ACCESS,
        statusCode: StatusCode.UNAUTHORIZED,
      });
    }

    const deletedCompany = await companyDbInterface.deleteCompany(
      company.id,
      user.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.DELETED,
      params,
      deletedCompany,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Brand Deleted Successfully",
        data: deletedCompany.id,
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

export const getCompanyBykey = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, params } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;

  try {
    Log.writeLog(Loglevel.INFO, moduleName, Actions.GET, params, uniqueId);

    const { key } = params;

    const companyDbInterface = new CompanyDbInterface(sequelize);
    const getComapany = await companyDbInterface.getcompanyByKey(key, true);

    // const outletDbInterface = new OutletDbInterface(sequelize);
    // const outlets = await outletDbInterface.getOutletsByCompanyId(
    //   getComapany.id
    // );

    // let outletTables = outlets.map((outlet) => {
    //   return outlet.OutletSeatingType?.map((seatType) => {
    //     return seatType.OutletTable?.map((outletTable) => {
    //       return outletTable.Table?.noOfPerson;
    //     });
    //   });
    // });

    // let tables = flatten(flatten(outletTables));

    // let tableMin = min(tables);
    // tableMin = tableMin ? tableMin : 0;

    // let tableMax = max(tables);
    // tableMax = tableMax ? tableMax : 0;

    // let groupOutletTables = outlets.map((outlet) => {
    //   return outlet.OutletSeatingType?.map((seatType) => {
    //     return seatType.GroupTable?.map((groupTable) => {
    //       return groupTable.maxPax;
    //     });
    //   });
    // });

    // let groupTables = flatten(flatten(groupOutletTables));

    // let groupTableMax = max(groupTables);

    // groupTableMax = groupTableMax ? groupTableMax : 0;

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      params,
      getComapany,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: {
          ...getComapany.toJSON(),
          minPax: 2,
          maxPax: 50,
        },
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

export const getUserCompany = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const uniqueId = getGuid();
  const { sequelize, decoded } = req;
  sequelizeValidate(sequelize, res);
  let user = await getAdminUser(sequelize);
  let outlet = null;
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "getUserCompany",
      uniqueId
    );

    const userId = decoded.userDetail.id;

    const userDbInterface = new UserDbInterface(sequelize);
    user = await userDbInterface.checkUserById(userId);

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getUserCompany",
      "User Found",
      uniqueId
    );

    const companyDbInterface = new CompanyDbInterface(sequelize);

    let getCompanies: CompanyDbModel[] = [];

    if (!user.roleId) {
      getCompanies = await companyDbInterface.getcompanyByUserId(user.id);
    } else {
      getCompanies = await companyDbInterface.getAllCompaniesForSuperUser();
    }

    const response = getCompanies.map((company) => {
      return {
        ...company.toJSON(),
        tags: JSON.parse(company.tags),
      };
    });

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.GET,
      "ALLCompanies",
      response,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );
    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        data: response,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.GET,
      "ALLCompanies",
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

export const updateComapnyMailChimp = async (
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
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      { body, params },
      uniqueId
    );
    const { companyId } = params;

    const userId = decoded.userDetail.id;
    const companyPayload: UpdateCompanyMailChimpPayload = body;

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

    if (companyPayload.tags) {
      companyPayload.tags = JSON.stringify(companyPayload.tags);
    }

    if (companyPayload.marketingId) {
      const marketingDbInterface = new MarketingDbInterface(sequelize);
      const marketing = await marketingDbInterface.getMarketingById(
        companyPayload.marketingId,
        false
      );

      Log.writeLog(
        Loglevel.INFO,
        moduleName,
        Actions.UPDATED,
        "Marketing Found",
        uniqueId
      );
      companyPayload.marketingId = marketing.id;
    } else {
      delete companyPayload.marketingId;
    }

    const updatedComapny = (
      await companyDbInterface.updateCompanyMailChimp(
        companyPayload,
        company.id,
        user.id
      )
    ).toJSON();

    const response = {
      ...updatedComapny,
      tags: JSON.parse(updatedComapny.tags),
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
        message: "Brand Updated Successfully",
        data: response,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.UPDATED,
      { body, params },
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

export const updateComapnyIvrs = async (
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
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      { body, params },
      uniqueId
    );
    const { companyId } = params;

    const userId = decoded.userDetail.id;
    const companyPayload: UpdateCompanyIvrsPayload = body;

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

    const updatedComapny = await companyDbInterface.updateCompanyIvrs(
      companyPayload,
      company.id,
      user.id
    );

    Log.writeExitLog(
      Loglevel.INFO,
      moduleName,
      Actions.UPDATED,
      body,
      updatedComapny,
      uniqueId,
      sequelize,
      LogTypes.SYSTEM_LOG,
      user,
      outlet
    );

    return res.status(StatusCode.SUCCESS).send(
      new ApiResponse({
        message: "Brand Updated Successfully",
        data: updatedComapny,
      })
    );
  } catch (error) {
    Log.writeExitLog(
      Loglevel.ERROR,
      moduleName,
      Actions.UPDATED,
      { body, params },
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
