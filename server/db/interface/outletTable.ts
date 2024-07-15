"use strict";

export interface OutletTable {
  id?: number;
  name: string;
  tableId: number;
  outletSeatingTypeId: number;
  outletSeatTypeId?: number;
  xPosition: number;
  yPosition: number;
  description?: string;
  minimumSpendAmount?: number;
  perPaxUnitDeposit?: number;
  isPrivate?: boolean;
  image: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
