import { Op, Sequelize, col, fn } from "sequelize";
import { Company } from "../db/interface";
import {
  ExcludeAttributes,
  ExcludeCompanyAttributes,
  ExcludeOutletAttributes,
} from "../context";
import {
  CompanyDbModel,
  MarketingDbModel,
  OutletDbModel,
  OutletUserDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { getGuid } from "../context/service";
import {
  UpdateCompanyIvrsPayload,
  UpdateCompanyMailChimpPayload,
} from "../@types/company";

export class CompanyDbInterface extends BaseInterface<CompanyDbModel> {
  public constructor(sequelize: Sequelize) {
    super(CompanyDbModel, sequelize);
  }

  //Create Company
  public create = async (
    company: Company,
    userId: number
  ): Promise<CompanyDbModel> => {
    try {
      const createCompany = await this.repository.create({
        ...company,
        key: getGuid(),
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createCompany)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createCompany;
    } catch (error) {
      throw error;
    }
  };

  //Get All Company
  public getAllcompany = async (
    isExclude = false
  ): Promise<CompanyDbModel[]> => {
    try {
      const companyQuery: any = {};
      if (isExclude)
        companyQuery.attributes = { exclude: ExcludeCompanyAttributes };
      else {
        companyQuery.attributes = {
          exclude: ["updatedBy"],
          include: [
            [
              fn(
                "concat",
                col("User.firstName"),
                " ",
                col("User.lastName"),
                ",",
                col("User.email")
              ),
              "updatedBy",
            ],
          ],
        };
      }

      const companies = await this.repository.findAll({
        ...companyQuery,
        order: ["id"],
        attributes: {
          exclude: ["updatedBy"],
          include: [
            [
              fn(
                "concat",
                col("User.firstName"),
                " ",
                col("User.lastName"),
                ",",
                col("User.email")
              ),
              "updatedBy",
            ],
          ],
        },
        include: [
          {
            model: OutletDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeOutletAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      return companies;
    } catch (error) {
      throw error;
    }
  };

  public getcompanyByKey = async (
    key: string,
    isExclude = false
  ): Promise<CompanyDbModel> => {
    try {
      const outLetQuery: any = {};
      if (isExclude)
        outLetQuery.attributes = { exclude: ExcludeOutletAttributes };

      const companyQuery: any = {};
      if (isExclude)
        companyQuery.attributes = { exclude: ExcludeCompanyAttributes };

      const company = await this.repository.findOne({
        ...companyQuery,
        where: { key },
        include: [
          {
            ...outLetQuery,
            model: OutletDbModel,
            where: { isActive: true },
            required: false,
          },
        ],
      });
      if (!company)
        throw new ApiError({
          message: Exceptions.INVALID_COMPANY,
          statusCode: StatusCode.NOTFOUND,
        });
      return company;
    } catch (error) {
      throw error;
    }
  };

  //Get Company By Id
  public getComapnyById = async (
    id: number,
    checkIsActive = true
  ): Promise<CompanyDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const company = await this.repository.findOne({
        where: query,
        attributes: {
          exclude: ["updatedBy", ...ExcludeAttributes],
          include: [
            [
              fn(
                "concat",
                col("User.firstName"),
                " ",
                col("User.lastName"),
                ",",
                col("User.email")
              ),
              "updatedBy",
            ],
          ],
        },
        include: [
          {
            model: MarketingDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
          {
            model: OutletDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!company)
        throw new ApiError({
          message: Exceptions.INVALID_COMPANY,
          statusCode: StatusCode.NOTFOUND,
        });
      return company;
    } catch (error) {
      throw error;
    }
  };

  public updateCompany = async (
    company: Company,
    id: number,
    userId: number
  ): Promise<CompanyDbModel> => {
    try {
      const updateComapny = await this.repository.update(
        { ...company, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateComapny[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_COMPANY,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getComapnyById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteCompany = async (
    id: number,
    userId: number
  ): Promise<CompanyDbModel> => {
    try {
      const company = await this.getComapnyById(id, false);
      company.updatedBy = userId;
      await company.save();
      await company.destroy();
      return company;
    } catch (error) {
      throw error;
    }
  };

  //Get Comapanies By UserId
  public getcompanyByUserId = async (
    userId: number
  ): Promise<CompanyDbModel[]> => {
    try {
      const companies = await this.repository.findAll({
        order: ["id"],
        include: [
          {
            model: OutletDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletUserDbModel,
                where: { userId, isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: MarketingDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return companies;
    } catch (error) {
      throw error;
    }
  };

  public getAllCompaniesForSuperUser = async (): Promise<CompanyDbModel[]> => {
    try {
      const companies = await this.repository.findAll({
        order: ["id"],
        include: [
          {
            model: OutletDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: MarketingDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return companies;
    } catch (error) {
      throw error;
    }
  };

  public updateCompanyMailChimp = async (
    company: UpdateCompanyMailChimpPayload,
    id: number,
    userId: number
  ): Promise<CompanyDbModel> => {
    try {
      const updateComapny = await this.repository.update(
        { ...company, updatedBy: userId },
        {
          where: {},
        }
      );

      if (updateComapny[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_COMPANY,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getComapnyById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public updateCompanyIvrs = async (
    company: UpdateCompanyIvrsPayload,
    id: number,
    userId: number
  ): Promise<CompanyDbModel> => {
    try {
      const updateComapny = await this.repository.update(
        { ...company, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateComapny[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_COMPANY,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getComapnyById(id, false);
    } catch (error) {
      throw error;
    }
  };

  //Get All Company
  public getAllcompanyByIdsWithOutlet = async (
    ids: number[]
  ): Promise<CompanyDbModel[]> => {
    try {
      const companies = await this.repository.findAll({
        where: {
          id: {
            [Op.in]: ids,
          },
          isActive: true,
        },
        include: [
          {
            model: OutletDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return companies;
    } catch (error) {
      throw error;
    }
  };

  //Get All Company
  public getAllcompanyByIds = async (
    ids: number[]
  ): Promise<CompanyDbModel[]> => {
    try {
      const companies = await this.repository.findAll({
        where: {
          id: {
            [Op.in]: ids,
          },
          isActive: true,
        },
        include: [
          {
            model: OutletDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return companies;
    } catch (error) {
      throw error;
    }
  };

  //Get Company By Id
  public findOneCompany = async (): Promise<CompanyDbModel | null> => {
    try {
      const company = await this.repository.findOne({
        attributes: {
          exclude: ["updatedBy", ...ExcludeAttributes],
          include: [
            [
              fn(
                "concat",
                col("User.firstName"),
                " ",
                col("User.lastName"),
                ",",
                col("User.email")
              ),
              "updatedBy",
            ],
          ],
        },
        include: [
          {
            model: MarketingDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
          {
            model: OutletDbModel,
            where: { isActive: true },
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });

      return company;
    } catch (error) {
      throw error;
    }
  };
}
