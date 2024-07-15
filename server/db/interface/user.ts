"use strict";

export interface User {
  id?: number;
  userName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  password?: string;
  gender?: string;
  dob?: Date;
  roleId?: number;
  loggedAt?: Date;
  isActive?: boolean;
  isPartially: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
