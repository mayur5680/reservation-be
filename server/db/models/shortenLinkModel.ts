"use strict";

import {
  Column,
  PrimaryKey,
  Model,
  AutoIncrement,
  Table,
  CreatedAt,
  UpdatedAt,
  AllowNull,
  DeletedAt,
} from "sequelize-typescript";

@Table({
  tableName: "ShortenLink",
  freezeTableName: true,
})
export class ShortenLinkDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column
  declare source: string;

  @AllowNull(false)
  @Column
  declare code: string;

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
