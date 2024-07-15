"use strict";

export interface DiningOption {
  id?: number;
  name: string;
  description: string;
  outletId: number;
  price: number;
  dailyMaxQty: number;
  bookingMaxQty?: number;
  originalPrice: number;
  leadTime?: number;
  blockTime?: string;
  repeatOn?: string;
  overridePrivateRoom?: boolean;
  image: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
