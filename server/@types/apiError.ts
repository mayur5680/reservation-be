import { StatusCode } from "../context";
import { Exceptions } from "../exception";

export type ErrorPayload = {
  message: Exceptions | string;
  devMessage?: string;
  statusCode: StatusCode;
};

export class ApiError {
  constructor(error: ErrorPayload) {
    return error;
  }
}
