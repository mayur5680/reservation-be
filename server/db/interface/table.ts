"use strict";

export interface Table {
  id?: number;
  name: string;
  noOfPerson?: number;
  outletId?: number;
  image?: string;
  shape: string;
  height?: string;
  width?: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
