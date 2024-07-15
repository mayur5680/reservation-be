"use strict";

export interface IvrsCallLogs {
  id?: number;
  ivrsId: number;
  logs: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
