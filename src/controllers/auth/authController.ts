import prisma from "../../config/prisma";
import bcrypt from 'bcrypt'
import asyncWrapper from "../../utils/asyncWrapper";
import { Request , Response } from 'express'
import APIError from "../../utils/APIError";
import APIResponse from "../../utils/APIResponse";
import { generateAccessToken, generateRefershToken } from "../../utils/generateTokens";

export const createUser = asyncWrapper( async(req: Request, res: Response) => {
    const { username, email, password } = req.body

    if(!username || !email || !password){
        throw APIError.badRequest('all fields are required')
    }

    const existingUser = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if( existingUser ){
        throw APIError.badRequest('Emial ID already exist with another account, try login')
   }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
        },
        select: {
            id: true
        }
    })

    if(user){

       const store =  await prisma.store.create({
            data: {
                userId: user.id
            },
            select: {
                id: true
            }
        })

        const accessToken = generateAccessToken({userId: user.id, storeId: store.id})
        const refreshToken = generateRefershToken({userId: user.id, storeId: store.id})

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)
        
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: hashedRefreshToken,
            }
        })

        res.cookie('token', {accessToken, refreshToken}, {
            httpOnly: true,
            secure: false, 
        })
        return APIResponse.created(res, 'user created successfully', { accessToken, refreshToken})
    }

    throw APIError.internal('something went wrong')
})

export const login = asyncWrapper(  async(req: Request, res: Response) => {
    const { email, password } = req.body

    if(!email || !password){
        throw APIError.badRequest('all fields are required')
    }

    const user = await prisma.user.findUnique({
        where: {
            email,
        },
        select: {
            id: true,
            store: true
        }
    })

    if(!user){
        throw APIError.badRequest('Invalid credentials')
    }
    const accessToken = generateAccessToken({userId: user.id, storeId: user.store?.id})
    const refreshToken = generateRefershToken({userId: user.id, storeId: user.store?.id})

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)
        
    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: hashedRefreshToken,
        }
    })

    res.cookie('token', {accessToken, refreshToken}, {
        httpOnly: true,
        secure: false, 
    })

    return APIResponse.created(res, 'user created successfully', { accessToken, refreshToken})

})
