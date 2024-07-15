"use strict";

export interface Customer {
  id?: number;
  outletId: number;
  name: string;
  lastName?: string;
  email: string | null;
  mobileNo: string;
  salutation?: string;
  gender?: string;
  dob?: Date;
  age?: number;
  address?: string;
  postalCode?: string;
  programName?: string;
  activationTerminal?: string;
  averageSpend?: number;
  lastTransactionDate?: Date;
  tags?: string;
  notes?: string;
  eatPoints?: number;
  noOfRefferalSignUp?: number;
  noOfRefferalPurchased?: number;
  customerCompanyName?: string;
  isPrivateTableBooked?: boolean;
  stripeId?: string;
  stripeJSON?: string;
  isOPT?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
