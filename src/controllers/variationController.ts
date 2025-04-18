import { Request, Response } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import prisma from "../config/prisma";
import APIResponse from "../utils/APIResponse";

export const getVariations = asyncWrapper( async(req: Request, res: Response) => {
   const { productId } = req.params
   
   const prouductVariation = await prisma.productVariation.findMany({
    where: {
        productId,
    },
    include: {
        option: {
            include: {
                option: true,
                optionValue: true
            }
        }
    }
   })

   return APIResponse.success(res, '', prouductVariation)
})

export const updateVariation = asyncWrapper( async(req: Request, res: Response) => {
    const { variationData } = req.body;

    await prisma.productVariation.update({
        where: {
            id: variationData.id
        },
        data: {
            isSellable: variationData.isSellable, 
            price: variationData.price,
            sku: variationData.sku,
            images: {
                set: variationData.images.map((id: string) => id)
                
            }
        }
    })
})