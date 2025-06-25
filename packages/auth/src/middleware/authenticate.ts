import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "@repo/auth";
import { UserJwtPayload } from "../types/types";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const headers = req.headers;
  const authToken = headers["authorization"]?.split(" ")[1];

  if (!authToken) {
    return res.status(401).json("Unauthorized");
  }

  try {
    const decoded = verifyJwt(authToken);
    if (typeof decoded === "string") {
      res.status(401).send("Invalid JWT Payload");
      return;
    }
    req.user = decoded as UserJwtPayload;
    next();
  } catch (err) {
    return res.status(401).send("Invalid access token");
  }
};

export default authenticate;
