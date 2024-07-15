import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { StatusCode } from "../../context";

interface ErrorPayload {
  [key: string]: any;
}

export const payloadValidation = (erroPaylaad: ErrorPayload, payload: any) => {
  const keys = Object.keys(erroPaylaad);
  keys.map((field) => {
    const value = payload[field];
    const dataType = erroPaylaad[field];
    const valueType = (typeof value).toString();
    if (
      !(
        value &&
        value !== "null" &&
        value !== undefined &&
        value !== "" &&
        valueType === dataType
      )
    ) {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: `${field} is required`,
        statusCode: StatusCode.BAD_REQUEST,
      });
    }
  });
};
