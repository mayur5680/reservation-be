import { Sequelize } from "sequelize";
import { Floor } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { FloorDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class FloorDbInterface extends BaseInterface<FloorDbModel> {
  public constructor(sequelize: Sequelize) {
    super(FloorDbModel, sequelize);
  }

  public create = async (
    floor: Floor,
    userId: number
  ): Promise<FloorDbModel> => {
    try {
      const createFloor = await this.repository.create({
        ...floor,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createFloor)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createFloor;
    } catch (error) {
      throw error;
    }
  };

  public getAllFloor = async (outletId: number): Promise<FloorDbModel[]> => {
    try {
      const getAllFloor = await this.repository.findAll({
        where: {
          outletId,
        },
        order: ["id"],
      });
      return getAllFloor;
    } catch (error) {
      throw error;
    }
  };

  public getFloorById = async (
    id: number,
    checkIsActive = true
  ): Promise<FloorDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const floor = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
      });
      if (!floor)
        throw new ApiError({
          message: Exceptions.INVALID_FLOOR,
          statusCode: StatusCode.NOTFOUND,
        });
      return floor;
    } catch (error) {
      throw error;
    }
  };

  public updateFloor = async (
    id: number,
    floor: Floor,
    userId: number
  ): Promise<FloorDbModel> => {
    try {
      const updateFloor = await this.repository.update(
        { ...floor, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateFloor[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_FLOOR,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getFloorById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteFloor = async (
    id: number,
    userId: number
  ): Promise<FloorDbModel> => {
    try {
      const floor = await this.getFloorById(id, false);
      floor.updatedBy = userId;
      await floor.save();
      await floor.destroy();
      return floor;
    } catch (error) {
      throw error;
    }
  };
}
