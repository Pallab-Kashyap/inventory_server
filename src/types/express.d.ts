import { Request } from "express";

interface UserPayload {
    userId: string,
    storeId: string
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export {
    UserPayload
};