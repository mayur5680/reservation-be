"use strict";

export interface Floor {
  id?: number;
  name: string;
  outletId: number;
  image?: string;
  description?: string;
  height?: string;
  width?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
