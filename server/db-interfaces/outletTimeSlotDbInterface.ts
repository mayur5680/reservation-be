import { Op, Sequelize, col, fn } from "sequelize";
import { OutletTimeSlot } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  OutletTimeSlotDbModel,
  SectionDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class OutletTimeSlotDbInterface extends BaseInterface<OutletTimeSlotDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletTimeSlotDbModel, sequelize);
  }

  //Create Meal Time Slot
  public create = async (
    outletTimeSlot: OutletTimeSlot,
    userId: number
  ): Promise<OutletTimeSlotDbModel> => {
    try {
      const createTimeSlot = await this.repository.create({
        ...outletTimeSlot,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createTimeSlot)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createTimeSlot;
    } catch (error) {
      throw error;
    }
  };

  //Get All Time Slot
  public getAllTimeSlot = async (
    outletId: number
  ): Promise<OutletTimeSlotDbModel[]> => {
    try {
      const getAllSlot = await this.repository.findAll({
        where: {
          outletId,
        },
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
            model: SectionDbModel,
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
        order: ["dayofweek"],
      });
      return getAllSlot;
    } catch (error) {
      throw error;
    }
  };

  //Get OutletTimeSlot by Id and OutletId
  public getOutletTimeSlotbyId = async (
    id: number,
    checkIsActive = true
  ): Promise<OutletTimeSlotDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const timeslot = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: SectionDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });

      if (!timeslot)
        throw new ApiError({
          message: Exceptions.INVALID_TIMESLOT,
          statusCode: StatusCode.NOTFOUND,
        });
      return timeslot;
    } catch (error) {
      throw error;
    }
  };

  //Get OutletTimeSlot by Id and OutletId
  public getOutletTimeSlotbyIdAndOutletId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<OutletTimeSlotDbModel> => {
    try {
      let query: any = { id, outletId };
      checkIsActive && (query.isActive = true);
      const timeslot = await this.repository.findOne({
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
            model: SectionDbModel,
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

      if (!timeslot)
        throw new ApiError({
          message: Exceptions.INVALID_TIMESLOT,
          statusCode: StatusCode.NOTFOUND,
        });
      return timeslot;
    } catch (error) {
      throw error;
    }
  };

  public updateTimeSlot = async (
    id: number,
    outletId: number,
    outletTimeSlot: OutletTimeSlot,
    userId: number
  ): Promise<OutletTimeSlotDbModel> => {
    try {
      const updateTimeSlot = await this.repository.update(
        { ...outletTimeSlot, updatedBy: userId },
        {
          where: {
            id,
            outletId,
          },
        }
      );

      if (updateTimeSlot[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_TIMESLOT,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getOutletTimeSlotbyIdAndOutletId(id, outletId, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteTimeSlot = async (
    id: number,
    outletId: number,
    userId: number
  ): Promise<OutletTimeSlotDbModel> => {
    try {
      const timeslot = await this.getOutletTimeSlotbyIdAndOutletId(
        id,
        outletId,
        false
      );
      timeslot.updatedBy = userId;
      await timeslot.save();
      await timeslot.destroy();
      return timeslot;
    } catch (error) {
      throw error;
    }
  };

  //Get Section
  public getSection = async (
    outletId: number,
    dayofweek: number,
    requestTime: string
  ): Promise<any> => {
    try {
      const timeSlot = await this.repository.findOne({
        where: {
          outletId,
          dayofweek,
          [Op.and]: {
            openingTime: {
              [Op.lte]: requestTime,
            },
            closingTime: {
              [Op.gt]: requestTime,
            },
          },
        },
        include: [
          {
            model: SectionDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });

      if (timeSlot && timeSlot.Section) return timeSlot.Section.name;
    } catch (error) {
      throw error;
    }
  };
}
