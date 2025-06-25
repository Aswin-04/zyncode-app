import "express"
import { UserJwtPayload } from "./types"

declare global {
  namespace Express {
    interface Request {
      user?: UserJwtPayload
    }
  }
}