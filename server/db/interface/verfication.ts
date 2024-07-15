"use strict";

export interface Verification {
  guid: string;
  userId: number;
  code: string;
  type: string;
  source: string;
  count?: number;
  expiredAt: Date;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
