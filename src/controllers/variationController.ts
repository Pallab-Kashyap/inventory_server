import { Request, Response } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import prisma from "../config/prisma";
import APIResponse from "../utils/APIResponse";

export const getProductVariations = asyncWrapper( async(req: Request, res: Response) => {
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