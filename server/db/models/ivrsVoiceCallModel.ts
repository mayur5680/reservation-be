"use strict";

import {
  Column,
  PrimaryKey,
  Model,
  AutoIncrement,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  ForeignKey,
  BelongsTo,
  AllowNull,
  DeletedAt,
} from "sequelize-typescript";

import { IvrsDetailsDbModel, UserDbModel } from ".";

@Table({
  tableName: "IvrsVoiceCall",
  freezeTableName: true,
})
export class IvrsVoiceCallDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column
  declare fromPhoneNo: string;

  @AllowNull(false)
  @Column({
    unique: "IvrsVoiceCall_path_key",
  })
  declare path: string;

  @AllowNull(false)
  @Column
  declare time: Date;

  @Default(false)
  @Column
  declare isLink: boolean;

  @AllowNull(true)
  @ForeignKey(() => IvrsDetailsDbModel)
  @Column
  declare IvrsDetailId: number;

  @BelongsTo(() => IvrsDetailsDbModel)
  declare IvrsDetails?: IvrsDetailsDbModel;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @AllowNull(true)
  @UpdatedAt
  @Column
  declare updatedAt: Date;

  @AllowNull(true)
  @DeletedAt
  @Column
  declare deletedAt: Date;

  @ForeignKey(() => UserDbModel)
  @Column
  declare createdBy: number;

  @ForeignKey(() => UserDbModel)
  @Column
  declare updatedBy: number;

  @BelongsTo(() => UserDbModel, {
    targetKey: "id",
    foreignKey: "updatedBy",
  })
  declare User?: UserDbModel;
}
