import { Op, Sequelize, col, fn } from "sequelize";
import { OutletTimeSlotOverride } from "../db/interface";
import { ExcludeAttributes } from "../context";
import {
  OutletTimeSlotOverrideDbModel,
  SectionDbModel,
  UserDbModel,
} from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class OutletTimeSlotOverrideDbInterface extends BaseInterface<OutletTimeSlotOverrideDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletTimeSlotOverrideDbModel, sequelize);
  }
  public create = async (
    outletTimeSlotOverride: OutletTimeSlotOverride,
    userId: number
  ): Promise<OutletTimeSlotOverrideDbModel> => {
    try {
      const createOverrideTimeSlot = await this.repository.create({
        ...outletTimeSlotOverride,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createOverrideTimeSlot)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createOverrideTimeSlot;
    } catch (error) {
      throw error;
    }
  };
  public getAllOverrideTimeSlot = async (
    outletId: number
  ): Promise<OutletTimeSlotOverrideDbModel[]> => {
    try {
      const getAllSlotOverride = await this.repository.findAll({
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
      return getAllSlotOverride;
    } catch (error) {
      throw error;
    }
  };

  public getOutletOverrideTimeSlotbyId = async (
    id: number,
    outletId: number,
    checkIsActive = true
  ): Promise<OutletTimeSlotOverrideDbModel> => {
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

  public updateOverrideTimeSlot = async (
    id: number,
    outletId: number,
    outletTimeSlotOverride: OutletTimeSlotOverride,
    userId: number
  ): Promise<OutletTimeSlotOverrideDbModel> => {
    try {
      const updateTimeSlot = await this.repository.update(
        { ...outletTimeSlotOverride, updatedBy: userId },
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

      return this.getOutletOverrideTimeSlotbyId(id, outletId, false);
    } catch (error) {
      throw error;
    }
  };
  public deleteTimeSlotOverride = async (
    id: number,
    outletId: number,
    userId: number
  ): Promise<OutletTimeSlotOverrideDbModel> => {
    try {
      const OverridetimeSlot = await this.getOutletOverrideTimeSlotbyId(
        id,
        outletId,
        false
      );
      OverridetimeSlot.updatedBy = userId;
      await OverridetimeSlot.save();
      await OverridetimeSlot.destroy();
      return OverridetimeSlot;
    } catch (error) {
      throw error;
    }
  };

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
