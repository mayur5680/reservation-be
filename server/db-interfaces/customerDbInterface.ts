import { Op, Sequelize, col, fn } from "sequelize";
import { Customer } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  CheckoutDbModel,
  CompanyDbModel,
  CouponDbModel,
  CustomerDbModel,
  CustomerLogsDbModel,
  OutletDbModel,
  OutletInvoiceDbModel,
  OutletTableBookingDbModel,
  OutletTableDbModel,
  TableDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { CustomerReportCrossGroupBy } from "../@types/report";
import { isNull } from "lodash";

export class CustomerDbInterface extends BaseInterface<CustomerDbModel> {
  public constructor(sequelize: Sequelize) {
    super(CustomerDbModel, sequelize);
  }

  public create = async (customer: Customer): Promise<CustomerDbModel> => {
    try {
      const createCustomer = await this.repository.create({ ...customer });
      if (!createCustomer)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createCustomer;
    } catch (error) {
      throw error;
    }
  };

  //Get Customer Profile by Id
  public getCustomerbyId = async (id: number): Promise<CustomerDbModel> => {
    try {
      const customer = await this.repository.findOne({
        where: { id },
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
            model: OutletDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: CompanyDbModel,
                where: { isActive: true },
                required: true,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });

      if (!customer)
        throw new ApiError({
          message: Exceptions.INVALID_CUSTOMER,
          statusCode: StatusCode.NOTFOUND,
        });
      return customer;
    } catch (error) {
      throw error;
    }
  };

  //Get Customer by Email and Phone Number
  public getCustomerbyEmailAndPhoneNo = async (
    email: string | null,
    mobileNo: string,
    outletId: number
  ): Promise<CustomerDbModel | null> => {
    try {
      const customer = await this.repository.findOne({
        where: { email, mobileNo, outletId },
        attributes: { exclude: ExcludeAttributes },
      });
      return customer;
    } catch (error) {
      throw error;
    }
  };

  //get customer for calaculate Churn Risk
  public getCustomerChurnRiskById = async (
    id: number
  ): Promise<CustomerDbModel> => {
    try {
      const customer = await this.repository.findOne({
        where: { id },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletInvoiceDbModel,
            paranoid: false,
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });

      if (!customer)
        throw new ApiError({
          message: Exceptions.INVALID_CUSTOMER,
          statusCode: StatusCode.NOTFOUND,
        });
      return customer;
    } catch (error) {
      throw error;
    }
  };

  //Get All Customer name by OutletId
  public getAllCustomersByCompanyId = async (
    companyQuery: any,
    query: any
  ): Promise<CustomerDbModel[]> => {
    try {
      let include = [
        {
          model: OutletInvoiceDbModel,
          where: query ? query : {},
          required: true,
          attributes: [],
        },
        {
          model: OutletDbModel,
          where: companyQuery,
          required: true,
          attributes: { exclude: ExcludeAttributes },
        },
      ];

      if (isNull(query)) {
        include = [
          {
            model: OutletDbModel,
            where: companyQuery,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ];
      }
      const Customer = await this.repository.findAll({
        attributes: ["id", "name", "lastName"],
        order: [["name", "ASC"]],
        include,
      });
      return Customer;
    } catch (error) {
      throw error;
    }
  };

  //Get Customer for Reservation by Id
  public getFilterCustomerReservation = async (
    id: number,
    query: any
  ): Promise<CustomerDbModel | null> => {
    try {
      const customer = await this.repository.findOne({
        where: { id },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletDbModel,
            paranoid: false,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: CustomerLogsDbModel,
            required: true,
            attributes: {
              exclude: ["updatedBy", ...ExcludeAttributes],
              include: [
                [
                  fn(
                    "concat",
                    col("CustomerLogs.User.firstName"),
                    " ",
                    col("CustomerLogs.User.lastName"),
                    ",",
                    col("CustomerLogs.User.email")
                  ),
                  "updatedBy",
                ],
              ],
            },
            include: [
              {
                model: UserDbModel,
                required: true,
                paranoid: false,
                attributes: [],
              },
            ],
          },
          {
            model: OutletInvoiceDbModel,
            where: query,
            required: true,
            attributes: { exclude: ExcludeAttributes },
            include: [
              {
                model: OutletTableBookingDbModel,
                paranoid: false,
                required: false,
                attributes: { exclude: ExcludeAttributes },
                include: [
                  {
                    model: OutletTableDbModel,
                    paranoid: false,
                    required: true,
                    attributes: { exclude: ExcludeAttributes },
                    include: [
                      {
                        model: TableDbModel,
                        paranoid: false,
                        required: true,
                        attributes: { exclude: ExcludeAttributes },
                      },
                    ],
                  },
                ],
              },
              {
                model: CouponDbModel,
                paranoid: false,
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
              {
                model: CheckoutDbModel,
                paranoid: false,
                required: false,
                attributes: { exclude: ExcludeAttributes },
              },
            ],
          },
        ],
        order: [
          ["OutletInvoice", "OutletTableBooking", "bookingStartTime", "ASC"],
        ],
      });
      return customer;
    } catch (error) {
      throw error;
    }
  };

  // update Customer by Id
  public updateCustomer = async (
    id: number,
    userId: number,
    customer: Customer
  ): Promise<CustomerDbModel> => {
    try {
      const updateCustomer = await this.repository.update(
        { ...customer, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateCustomer[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_CUSTOMER,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getCustomerbyId(id);
    } catch (error) {
      throw error;
    }
  };

  //Get Customer Name by Phone Number
  public getCustomerPhoneNo = async (
    mobileNo: string
  ): Promise<CustomerDbModel | null> => {
    try {
      const customer = await this.repository.findOne({
        where: { mobileNo },
        attributes: { exclude: ExcludeAttributes },
      });

      return customer;
    } catch (error) {
      throw error;
    }
  };

  //get customer for calaculate AverageSpend
  public getCustomerAverageSpend = async (
    id: number
  ): Promise<CustomerDbModel> => {
    try {
      const customer = await this.repository.findOne({
        where: { id },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: OutletInvoiceDbModel,
            paranoid: false,
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!customer)
        throw new ApiError({
          message: Exceptions.INVALID_CUSTOMER,
          statusCode: StatusCode.NOTFOUND,
        });
      return customer;
    } catch (error) {
      throw error;
    }
  };

  //Get All Customer name by PhoneNo and Email
  public getAllCustomersInCompanyLevel = async (
    email: string,
    mobileNo: string,
    companyId: number
  ): Promise<CustomerDbModel[]> => {
    try {
      const Customer = await this.repository.findAll({
        where: { email, mobileNo },
        include: [
          {
            model: OutletDbModel,
            where: { isActive: true, companyId },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletInvoiceDbModel,
            paranoid: false,
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return Customer;
    } catch (error) {
      throw error;
    }
  };

  //Get Customer by Email and Phone Number
  public getCustomerForReport = async (
    ids: number[]
  ): Promise<CustomerReportCrossGroupBy[]> => {
    try {
      const customer = await this.repository.findAll({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
        attributes: ["email", "mobileNo", [fn("COUNT", "*"), "count"]],
        group: ["email", "mobileNo"],
        having: Sequelize.where(fn("COUNT", "*"), {
          [Op.gt]: 1,
        }),
        raw: true,
      });

      return customer as unknown as CustomerReportCrossGroupBy[];
    } catch (error) {
      throw error;
    }
  };
}
