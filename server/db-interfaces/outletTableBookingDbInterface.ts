import { Sequelize, Transaction } from "sequelize";
import { OutletTableBookingDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode, ExcludeAttributes, BookingStatus } from "../context";
import { ApiError } from "../@types/apiError";
import { OutletTableBookingPayload } from "../@types/outletTableBooking";

export class OutletTableBookingDbInterface extends BaseInterface<OutletTableBookingDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletTableBookingDbModel, sequelize);
  }

  //with transaction
  public create = async (
    outletTableBookingPayload: OutletTableBookingPayload,
    outletId: number,
    bookingStartTime: Date,
    bookingEndTime: Date,
    status: BookingStatus,
    transaction: Transaction
  ): Promise<OutletTableBookingDbModel[]> => {
    try {
      const { outletInvoice, outletTable } = outletTableBookingPayload;
      const outletTableBooking = await Promise.all(
        outletTable.map(async (table) => {
          const createOutletTableBooking = await this.repository.create(
            {
              outletInvoiceId: outletInvoice.id,
              outletTableId: table.id,
              outletId,
              bookingStartTime,
              bookingEndTime,
              status,
            },
            { transaction }
          );
          if (!createOutletTableBooking)
            throw new ApiError({
              message: Exceptions.INTERNAL_ERROR,
              statusCode: StatusCode.SERVER_ERROR,
            });
          return createOutletTableBooking;
        })
      );
      return outletTableBooking;
    } catch (error) {
      throw error;
    }
  };

  //without transaction
  public createee = async (
    outletTableBookingPayload: OutletTableBookingPayload,
    outletId: number,
    bookingStartTime: Date,
    bookingEndTime: Date,
    status: BookingStatus
  ): Promise<OutletTableBookingDbModel[]> => {
    try {
      const { outletInvoice, outletTable } = outletTableBookingPayload;
      const outletTableBooking = await Promise.all(
        outletTable.map(async (table) => {
          const createOutletTableBooking = await this.repository.create({
            outletInvoiceId: outletInvoice.id,
            outletTableId: table.id,
            outletId,
            bookingStartTime,
            bookingEndTime,
            status,
          });
          if (!createOutletTableBooking)
            throw new ApiError({
              message: Exceptions.INTERNAL_ERROR,
              statusCode: StatusCode.SERVER_ERROR,
            });
          return createOutletTableBooking;
        })
      );
      return outletTableBooking;
    } catch (error) {
      throw error;
    }
  };

  public getOutletTableBookingById = async (
    id: number
  ): Promise<OutletTableBookingDbModel> => {
    try {
      const outletTableBooking = await this.repository.findOne({
        where: {
          id,
        },
        attributes: { exclude: ExcludeAttributes },
      });
      if (!outletTableBooking)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
      return outletTableBooking;
    } catch (error) {
      throw error;
    }
  };

  //Update Status by Id
  public UpdateStatusById = async (id: number, query: any): Promise<void> => {
    try {
      const updateTableStatus = await this.repository.update(query, {
        where: {
          id,
        },
      });

      if (updateTableStatus[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
    } catch (error) {
      throw error;
    }
  };

  //Update Status by InvoiceId
  public UpdateStatusByInvoiceId = async (
    outletInvoiceId: string,
    query: any
  ): Promise<void> => {
    try {
      const updateTableStatus = await this.repository.update(query, {
        where: {
          outletInvoiceId,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  //Move OutletTableBooking  to Another OutletTAble
  public UpdateOutletTableId = async (
    id: number,
    outletTableId: number
  ): Promise<void> => {
    try {
      const moveOutleTable = await this.repository.update(
        { outletTableId },
        {
          where: {
            id,
          },
        }
      );

      if (moveOutleTable[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
    } catch (error) {
      throw error;
    }
  };

  public UpdateOutletTableInTimeTable = async (
    id: number,
    outletTableId: number,
    bookingStartTime: Date,
    bookingEndTime: Date,
    userId: number
  ): Promise<void> => {
    try {
      const moveOutleTable = await this.repository.update(
        { outletTableId, bookingStartTime, bookingEndTime, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (moveOutleTable[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_TABLE,
          statusCode: StatusCode.NOTFOUND,
        });
    } catch (error) {
      throw error;
    }
  };

  public deleteOutletTableBooking = async (
    outletInvoiceId: string,
    transaction: Transaction
  ): Promise<void> => {
    try {
      await this.repository.destroy({
        where: {
          outletInvoiceId,
        },
        force: true,
        transaction,
      });
    } catch (error) {
      throw error;
    }
  };

  public deleteOutletTableBookingByInvoiceId =  async (
    outletInvoiceId: string
  ): Promise<void> => {
    try {
      await this.repository.destroy({
        where: {
          outletInvoiceId,
        },
        force: true,
      });
    } catch (error) {
      throw error;
    }
  };
}
