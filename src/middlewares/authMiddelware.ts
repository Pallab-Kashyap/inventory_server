import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import APIError from "../utils/APIError";
import { verifyToken } from "../utils/generateTokens";
import { JwtPayload } from "jsonwebtoken";
import { UserPayload } from "../types/express";

export const auth = asyncWrapper( async(req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies.token

    if(!token){
        token = req.header('Authorization');
        if(!token || !token.startsWith('Bearer')){
            throw APIError.unauthorized('Token not found')
        }
        token = token.split(' ')[1]
    }

    const user = verifyToken(token) as UserPayload

    req.user = user

    next()

})