import { Sequelize, Transaction, col, fn } from "sequelize";
import { OutletInvoice } from "../db/interface";
import {
  ExcludeAttributes,
  ExcludeCompanyAttributes,
  ExcludeOutletAttributes,
} from "../context";
import {
  OutletInvoiceDbModel,
  CustomerDbModel,
  OutletTableBookingDbModel,
  OutletTableDbModel,
  TableDbModel,
  OutletDbModel,
  CouponDbModel,
  DiningOptionDbModel,
  CompanyDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { UpdateInvoice } from "../@types/outletInvoice";
import { CustomerReportCrossGroupBy } from "../@types/report";

export class OutletInvoiceDbInterface extends BaseInterface<OutletInvoiceDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletInvoiceDbModel, sequelize);
  }

  //with transaction
  public create = async (
    outletInvoice: OutletInvoice,
    transaction: Transaction
  ): Promise<OutletInvoiceDbModel> => {
    try {
      const createOutletInvoice = await this.repository.create(
        {
          ...outletInvoice,
        },
        { transaction }
      );
      if (!createOutletInvoice)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createOutletInvoice;
    } catch (error) {
      throw error;
    }
  };

  //without transaction
  public createee = async (
    outletInvoice: OutletInvoice
  ): Promise<OutletInvoiceDbModel> => {
    try {
      const createOutletInvoice = await this.repository.create({
        ...outletInvoice,
      });
      if (!createOutletInvoice)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createOutletInvoice;
    } catch (error) {
      throw error;
    }
  };

  public getInvoiceById = async (id: string): Promise<OutletInvoiceDbModel> => {
    try {
      const invoice = await this.repository.findOne({
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
            model: CustomerDbModel,
            paranoid: false,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletDbModel,
            paranoid: false,
            required: true,
            attributes: { exclude: ExcludeOutletAttributes },
            include: [
              {
                model: CompanyDbModel,
                paranoid: false,
                required: true,
                attributes: { exclude: ExcludeCompanyAttributes },
              },
            ],
          },
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
            model: DiningOptionDbModel,
            paranoid: false,
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: false,
            paranoid: false,
            attributes: [],
          },
        ],
      });
      if (!invoice)
        throw new ApiError({
          message: Exceptions.INVALID_INVOICE,
          statusCode: StatusCode.NOTFOUND,
        });
      return invoice;
    } catch (error) {
      throw error;
    }
  };

  public getInvoiceByFilter = async (
    query: any
  ): Promise<OutletInvoiceDbModel[]> => {
    try {
      const invoice = await this.repository.findAll({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: CustomerDbModel,
            paranoid: false,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletDbModel,
            paranoid: false,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
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
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: DiningOptionDbModel,
            paranoid: false,
            required: false,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: [["bookingDate", "ASC"]],
      });
      return invoice;
    } catch (error) {
      throw error;
    }
  };

  public updateInvoiceStatus = async (
    id: string,
    updateInvoice: UpdateInvoice,
    userId: number
  ): Promise<OutletInvoiceDbModel> => {
    try {
      const updateInvoiceStatus = await this.repository.update(
        { ...updateInvoice, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateInvoiceStatus[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_INVOICE,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getInvoiceById(id);
    } catch (error) {
      throw error;
    }
  };

  public getInvoiceByTicketId = async (
    ticketingId: number
  ): Promise<OutletInvoiceDbModel[]> => {
    try {
      const invoice = await this.repository.findAll({
        where: { ticketingId },
        attributes: { exclude: ExcludeAttributes },
      });
      return invoice;
    } catch (error) {
      throw error;
    }
  };

  public updateInvoiceWithTransction = async (
    id: string,
    updateInvoice: UpdateInvoice,
    transaction: Transaction
  ): Promise<OutletInvoiceDbModel> => {
    try {
      const updateInvoiceStatus = await this.repository.update(
        { ...updateInvoice },
        {
          where: {
            id,
          },
          transaction,
        }
      );

      if (updateInvoiceStatus[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_INVOICE,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getInvoiceById(id);
    } catch (error) {
      throw error;
    }
  };

  public getAllInvoiceForReports = async (
    query: any
  ): Promise<OutletInvoiceDbModel[]> => {
    try {
      const invoice = await this.repository.findAll({
        where: query,
        include: [
          {
            model: CustomerDbModel,
            paranoid: false,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletDbModel,
            paranoid: false,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: OutletTableBookingDbModel,
            paranoid: false,
            required: true,
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
        ],
      });
      return invoice;
    } catch (error) {
      throw error;
    }
  };

  public getAllInvoiceForCustomerReport = async (
    query: any
  ): Promise<CustomerReportCrossGroupBy[]> => {
    try {
      const invoice = await this.repository.findAll({
        where: query,
        attributes: [
          ["customerId", "customerId"],
          ["outletId", "outletID"],
          [fn("count", col("OutletInvoiceDbModel.id")), "totalBookingCount"],
        ],
        group: ["customerId", "outletID"],
        include: [
          {
            model: CustomerDbModel,
            as: "Customer",
            paranoid: false,
            required: true,
            attributes: [],
          },
          {
            model: OutletDbModel,
            as: "Outlet",
            required: true,
            attributes: [],
          },
        ],
        raw: true,
      });

      const response = invoice as unknown as CustomerReportCrossGroupBy[];

      return response;
    } catch (error) {
      throw error;
    }
  };

  public getInvoiceByEmailBookingIdAndTime = async (
    chopeBookingId: string
  ): Promise<OutletInvoiceDbModel | null> => {
    try {
      const invoice = await this.repository.findOne({
        where: { chopeBookingId },
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: CustomerDbModel,
            paranoid: false,
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      return invoice;
    } catch (error) {
      throw error;
    }
  };
}
