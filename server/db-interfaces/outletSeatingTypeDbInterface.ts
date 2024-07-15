import { Op, Sequelize } from "sequelize";
import { BaseInterface } from "./baseDbInterface";
import { ExcludeAttributes } from "../context";
import { Exceptions } from "../exception";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";
import { OutletSeatingType } from "../db/interface";
import { OutletSeatingTypeDbModel, SeatingTypeDbModel } from "../db/models";
import { OutletTableDbInterface } from "./outletTableDbInterface";

export class OutletSeatingTypeDbInterface extends BaseInterface<OutletSeatingTypeDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletSeatingTypeDbModel, sequelize);
  }

  public create = async (
    seatingType: number[],
    outletId: number,
    userId: number
  ): Promise<OutletSeatingTypeDbModel[]> => {
    try {
      let outletSeatingTypes: OutletSeatingType[] = [];

      seatingType.map((seatingType) => {
        const outletSeatingType: OutletSeatingType = {
          seatingTypeId: seatingType,
          outletId: outletId,
          createdBy: userId,
          updatedBy: userId,
          deletedAt: undefined,
        };
        outletSeatingTypes.push(outletSeatingType);
      });

      const createOutletSeating = await this.repository.bulkCreate(
        outletSeatingTypes as any,
        {
          updateOnDuplicate: ["updatedBy", "deletedAt"],
        }
      );

      if (!createOutletSeating)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return this.getAllOutletSeatingType(outletId);
    } catch (error) {
      throw error;
    }
  };

  public getAllOutletSeatingType = async (
    id: number
  ): Promise<OutletSeatingTypeDbModel[]> => {
    try {
      const getAllOutletSeatingType = await this.repository.findAll({
        where: {
          outletId: id,
        },
        include: [
          {
            model: SeatingTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
        order: ["seatingTypeId"],
      });
      return getAllOutletSeatingType;
    } catch (error) {
      throw error;
    }
  };

  public deleteOutletSeatingType = async (
    ids: number[],
    outletTableDbInterface: OutletTableDbInterface
  ): Promise<void> => {
    try {
      //Delete OutletTable
      //await outletTableDbInterface.deleteOutletTableBySeatingTypeId(ids);

      await this.repository.destroy({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  };

  public getOutletSeatingById = async (
    id: number,
    checkIsActive = true
  ): Promise<OutletSeatingTypeDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const outletSeatingType = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        include: [
          {
            model: SeatingTypeDbModel,
            where: { isActive: true },
            required: true,
            attributes: { exclude: ExcludeAttributes },
          },
        ],
      });
      if (!outletSeatingType)
        throw new ApiError({
          message: Exceptions.INVALID_SEATINGTYPE,
          statusCode: StatusCode.NOTFOUND,
        });
      return outletSeatingType;
    } catch (error) {
      throw error;
    }
  };

  public UploadImage = async (
    id: number,
    outletSeatingType: OutletSeatingType,
    userId: number
  ): Promise<OutletSeatingTypeDbModel> => {
    try {
      const updateOutletSeatingType = await this.repository.update(
        { ...outletSeatingType, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );

      if (updateOutletSeatingType[0] === 0)
        throw new ApiError({
          message: Exceptions.INVALID_SEATINGTYPE,
          statusCode: StatusCode.NOTFOUND,
        });

      return this.getOutletSeatingById(id, false);
    } catch (error) {
      throw error;
    }
  };
}
