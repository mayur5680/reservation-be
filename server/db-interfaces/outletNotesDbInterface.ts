import { Sequelize } from "sequelize";
import { OutletNotes } from "../db/interface";
import { ExcludeAttributes } from "../context";
import { OutletNotesDbModel } from "../db/models";
import { Exceptions } from "../exception";
import { BaseInterface } from "./baseDbInterface";
import { StatusCode } from "../context";
import { ApiError } from "../@types/apiError";

export class OutletNotesDbInterface extends BaseInterface<OutletNotesDbModel> {
  public constructor(sequelize: Sequelize) {
    super(OutletNotesDbModel, sequelize);
  }

  public create = async (
    outletNotes: OutletNotes,
    userId: Number
  ): Promise<OutletNotesDbModel> => {
    try {
      const createNotes = await this.repository.create({
        ...outletNotes,
        createdBy: userId,
        updatedBy: userId,
      });
      if (!createNotes)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return createNotes;
    } catch (error) {
      throw error;
    }
  };

  public getNotesById = async (
    id: number,
    checkIsActive = true
  ): Promise<OutletNotesDbModel> => {
    try {
      let query: any = { id };
      checkIsActive && (query.isActive = true);
      const note = await this.repository.findOne({
        where: query,
        attributes: { exclude: ExcludeAttributes },
      });
      if (!note)
        throw new ApiError({
          message: Exceptions.INVALID_NOTES,
          statusCode: StatusCode.NOTFOUND,
        });
      return note;
    } catch (error) {
      throw error;
    }
  };

  public getAllNotes = async (query: any): Promise<OutletNotesDbModel[]> => {
    try {
      const getAllRoles = await this.repository.findAll({
        where: query,
        attributes: { exclude: ExcludeAttributes },
        order: [["id", "DESC"]],
      });
      return getAllRoles;
    } catch (error) {
      throw error;
    }
  };

  public update = async (
    id: number,
    outletNotes: OutletNotes,
    userId: Number
  ): Promise<OutletNotesDbModel> => {
    try {
      const updateNotes = await this.repository.update(
        { ...outletNotes, updatedBy: userId },
        {
          where: {
            id,
          },
        }
      );
      if (!updateNotes)
        throw new ApiError({
          message: Exceptions.INTERNAL_ERROR,
          statusCode: StatusCode.SERVER_ERROR,
        });
      return this.getNotesById(id, false);
    } catch (error) {
      throw error;
    }
  };

  public deleteNotes = async (
    id: number,
    userId: number
  ): Promise<OutletNotesDbModel> => {
    try {
      const note = await this.getNotesById(id, false);
      note.updatedBy = userId;
      await note.save();
      await note.destroy();
      return note;
    } catch (error) {
      throw error;
    }
  };
}
