"use strict";

import {
  Column,
  PrimaryKey,
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  ForeignKey,
  BelongsTo,
  AllowNull,
  DeletedAt,
} from "sequelize-typescript";

import { UserDbModel } from ".";

@Table({
  tableName: "Verification",
  freezeTableName: true,
})
export class VerificationDbModel extends Model {
  @PrimaryKey
  @Column
  declare guid: string;

  @ForeignKey(() => UserDbModel)
  @AllowNull(false)
  @Column
  declare userId: number;

  @BelongsTo(() => UserDbModel)
  declare User?: UserDbModel;

  @AllowNull(false)
  @Column
  declare code: string;

  @AllowNull(false)
  @Column
  declare type: string;

  @AllowNull(false)
  @Column
  declare source: string;

  @Default(0)
  @AllowNull(false)
  @Column
  declare count: number;

  @CreatedAt
  @Column
  declare expiredAt: Date;

  @Default(true)
  @Column
  declare isActive: boolean;

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
}
