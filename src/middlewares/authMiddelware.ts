import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import APIError from "../utils/APIError";
import { generateAccessToken, verifyToken } from "../utils/generateTokens";
import { UserPayload } from "../types/express";
import prisma from "../config/prisma";
import bcrypt from 'bcrypt'

//NOT READY TO RECIEVE TOKENS FROM HEADER

export const auth = asyncWrapper( async(req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies.token

    if(!token){
        token = req.header('Authorization');
        if(!token || !token.startsWith('Bearer')){
            throw APIError.unauthorized('Token not found')
        }
        token = token.split(' ')[1]
    }

    try {
        const user = verifyToken(token.accessToken) as UserPayload
        req.user = user
        return next()
    } catch (error) {
        if(error === 'TokenExpiredError'){
            const user = verifyToken(token.refreshToken) as UserPayload
            const refreshTokens = await prisma.refreshToken.findMany({ where: {
                userId: user.userId
            },
            orderBy: {
                createdAt: "asc"
            }
            }
            )

           let matchedToken;

            for (const tokenObj of refreshTokens) {
                const isMatch = await bcrypt.compare(token.refreshToken, tokenObj.token);
                if (isMatch) {
                  matchedToken = tokenObj;
                  break;
                }
              }

              if(!matchedToken){
                throw APIError.badRequest('Invalid token')
              }else{
                const accessToken = generateAccessToken({ userId: user.userId, storeId: user.storeId })
                res.cookie('token', {accessToken, refreshToken: token.refreshToken}, {
                    httpOnly: true,
                    secure: true
                })
              }
              req.user = user
             return next()
        }
        else{
            throw APIError.badRequest('Invalid token')
        }
    }

})