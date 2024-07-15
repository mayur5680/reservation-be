"use strict";

export interface OutletNotes {
  id?: number;
  description: string;
  noteLevel: string;
  outletId: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
