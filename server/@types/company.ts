export interface UpdateCompanyMailChimpPayload {
  mailChimpPublicKey?: string;
  mailChimpPrivateKey?: string;
  tags?: string;
  mailChimpStatus?: Boolean;
  marketingId?: number;
  mailChimpUserName?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioMessagingServiceSid?: string;
}

export interface UpdateCompanyIvrsPayload {
  ivrsUserKey: string;
  ivrsSecretKey: string;
}
