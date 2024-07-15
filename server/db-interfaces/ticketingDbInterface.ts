import { Op, Sequelize, col, fn } from "sequelize";
import { Ticketing } from "../db/interface";
import { ExcludeAttributes, ExcludeCompanyAttributes, ExcludeOutletAttributes } from "../context";
import {
  CompanyDbModel,
  OutletDbModel,
  TicketingDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class TicketingDbInterface extends BaseInterface<TicketingDbModel> {
  public constructor(sequelize: Sequelize) {
    super(TicketingDbModel, sequelize);
  }

  public create = async (
    ticketing: Ticketing,
    userId: number
  ): Promise<TicketingDbModel> => {
    try {
      const createTicketing = await this.repository.create({
        ...ticketing,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createTicketing)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createTicketing;
    } catch (error) {
      throw error;
    }
  };

  public getAllTicketByOutletId = async (
    query: any
  ): Promise<TicketingDbModel[]> => {
    try {
      const ticket = await this.repository.findAll({
        where: query,
        order: [["startDate", "ASC"]],
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
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
        raw: true,
      });

      return ticket;
    } catch (error) {
      throw error;
    }
  };

  //Get Ticket By Id
  public getTicketById = async (
    id: number,
    checkIsActive = true
  ): Promise<TicketingDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const ticket = await this.repository.findOne({
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
            model: OutletDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
          {
            model: UserDbModel,
            required: true,
            where: { isActive: true },
            attributes: [],
          },
        ],
      });
      if (!ticket)
        throw new ApiError({
          message: Exceptions.INVALID_TICKET,
          statusCode: StatusCode.NOTFOUND,
        });
      return ticket;
    } catch (error) {
      throw error;
    }
  };

  //Update Ticket By Id
  public updateTicket = async (
    id: number,
    ticketing: Ticketing,
    userId: number
  ): Promise<TicketingDbModel> => {
    try {
      const updateTicket = await this.repository.update(
        { ...ticketing, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateTicket[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_TICKET,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getTicketById(id, false);
    } catch (error) {
      throw error;
    }
  };

  //Delete Ticket By Id
  public deleteTicket = async (
    id: number,
    userId: number
  ): Promise<TicketingDbModel> => {
    try {
      const ticket = await this.getTicketById(id, false);
      ticket.updatedBy = userId;
      await ticket.save();
      await ticket.destroy();
      return ticket;
    } catch (error) {
      throw error;
    }
  };

  public getAllTicketForTimeSlot = async (
    outletId: number
  ): Promise<TicketingDbModel[]> => {
    try {
      const ticket = await this.repository.findAll({
        where: {
          outletId,
          isActive: true,
          blockSchedule: true,
        },
        raw: true,
      });

      return ticket;
    } catch (error) {
      throw error;
    }
  };

  public getAllTicketByCompanyKey = async (
    comapnyId: number
  ): Promise<TicketingDbModel[]> => {
    try {
      const ticket = await this.repository.findAll({
        where: { isActive: true },
        order: [["startDate", "ASC"]],
        include: [
          {
            model: OutletDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeOutletAttributes },
            include: [
              {
                model: CompanyDbModel,
                where: { id: comapnyId, isActive: true },
                required: true,
                attributes: { exclude: ExcludeCompanyAttributes },
              },
            ],
          },
        ],
      });

      return ticket;
    } catch (error) {
      throw error;
    }
  };
}
