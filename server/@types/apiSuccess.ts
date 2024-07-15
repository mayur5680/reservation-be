import { Exceptions } from "../exception";

export type ResponsePayload = {
  message?: string;
  data?: any;
};

export class ApiResponse {
  constructor(resonse: ResponsePayload) {
    return resonse;
  }
}
