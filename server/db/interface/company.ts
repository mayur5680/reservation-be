"use strict";

export interface Company {
  id?: number;
  key: string;
  name: string;
  contentLanguage?: string;
  description?: string;
  image?: string;
  mailChimpPublicKey?: string;
  mailChimpPrivateKey?: string;
  mailChimpUserName?: string;
  tags?: string;
  mailChimpStatus?: boolean;
  marketingId?: number;
  ivrsUserKey?: string;
  ivrsSecretKey?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioMessagingServiceSid?: string;
  paymentTC?: string;
  noPaymentTC?: string;
  timezone?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
