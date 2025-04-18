import { Request, Response } from "express"

import uploadOnCloudinary from "../service/uploadCloudinary"
import asyncWrapper from "../utils/asyncWrapper"
import APIError from "../utils/APIError"
import prisma from "../config/prisma"
import APIResponse from "../utils/APIResponse"

//  DELETE IMAGE

export const uploadImage = asyncWrapper(async (req: Request, res: Response) => {
    const filePath = req.file?.path
    const { storeId } = req.user!
    const { imageName } = req.body

    if (!filePath) {
        throw APIError.badRequest('file missing')
    }
    const { url, publicId } = await uploadOnCloudinary(filePath)

    if (!url || !publicId) { throw APIError.internal('Error in uploading file to cloudinary') }

    const image = await prisma.image.create({
        data: {
            storeId,
            url,
            publicId,
            imageName: imageName || req.file?.filename
        }
    })

    if (!image) {
        throw APIError.internal('Error in storing data in DB')

    }

    APIResponse.created(res, 'Image stored successfully', image)
}

)

export const getAllImages = asyncWrapper( async(req: Request, res: Response) => {
    const { page, limit } = req.params
    
    const images = await prisma.image.findMany({
        where: {
            storeId: req.user?.storeId,
            isDeleted: false
        },
        select: {
            id: true,
            url: true,
            imageName: true,
        }
    })

    APIResponse.success(res, '', images)
})

export const deleteImage = asyncWrapper( async(req: Request, res: Response) => {
    await prisma.image.update({
        where: { id: req.params.imageId},
        data: { isDeleted: true }
    })
    
    APIResponse.success(res, "Image deleted", null)
})




