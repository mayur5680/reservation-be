"use strict";

export interface TableSection {
  id?: number;
  name: string;
  color: string;
  outletSeatingTypeId: number;
  outletId?: number;
  description?: string;
  minPax?: number;
  maxPax?: number;
  originalPrice?: number;
  price?: number;
  isPrivate?: boolean;
  image?: string;
  blockTime?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
