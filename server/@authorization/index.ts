import jwt from "jsonwebtoken";
import { jwtkey } from "../config";

export const validateAuthorization = (req: any, res: any, next: any): any => {
  try {
    // check header or url parameters or post parameters for token
    let authorizationToken = req.headers["authorization"];
    if (!authorizationToken) {
      // if there is no token, return an error
      return res.status(401).json({
        user_msg: "No token provided.",
        dev_msg: "No token provided.",
      });
    }

    const decoded = jwt.verify(authorizationToken, jwtkey);
    if (decoded) {
      req.decoded = decoded;
      return next();
    }

    throw new Error("Failed to authenticate token.");
  } catch (error) {
    return res.status(401).json({
      user_msg: "Failed to authenticate token.",
      dev_msg: "Failed to authenticate token.",
    });
  }
};
