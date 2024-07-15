"use strict";

export interface Outlet {
  id?: number;
  name: string;
  companyId?: number;
  description: string;
  address1: string;
  address2?: string;
  postcode: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  googlePlaceId: string;
  gst: string;
  rebookingTableInterval: string;
  timeSlotInterval?: string;
  timezone?: string;
  allowOrder?: boolean;
  allowBooking?: boolean;
  image?: string;
  paxSpacing?: number;
  ivrsPhoneNo?: string;
  blockTime?: string;
  chopeName?: string;
  oddleName?: string;
  SipCode?: string;
  createdBy?: number;
  updatedBy?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
