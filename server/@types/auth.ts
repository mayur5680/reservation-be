import { User } from "../db/interface";

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expirIn: number;
  userDetail: User;
}

export interface ForgetPasswordRequest {
  userName: string;
  type: string;
}

export interface ForgetPasswordResponse {
  verificationToken: string;
  source: string;
}

export interface VerifyCodeRequest {
  verificationToken: string;
  code: string;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}
