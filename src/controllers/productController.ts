import { Request, Response } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import APIError from "../utils/APIError";
import prisma from "../config/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { connect } from "http2";
import APIResponse from "../utils/APIResponse";

interface Option {
  optionId: string,
  optionValueId: string
}

interface Variation { 
    stock: number
    costPerUnit: Decimal
    image: string[]
    option: Option[]
}

interface ProductData {
    productName: string
    imageIds: string[]
    categoryIds: string[]
    baseCategoryId: string
}

async function createVariations(productId: string, variationList: Variation[]) {
    try {
    
      for (const variation of variationList) {

        const optionValueIds = variation.option.map( opt => opt.optionValueId)
      
        const optionValues = await prisma.optionValue.findMany({
          where: { id: { in: optionValueIds } },
          select: { optionValue: true, optionId: true },
        });
        const variationName = optionValues.map(ov => ov.optionValue).join(', '); 
  
      
        const productVariation = await prisma.productVariation.create({
          data: {
            product: { connect: { id: productId } }, 
            variationName,                           
            stockQuantity: variation.stock,          
            price: variation.costPerUnit,           
            images: {
              connect: variation.image.map(id => ({ id })), 
            },
            isActive: true,                        
            // sku: generateSKU(),                  
          },
        });
  

        const productVariationOptions = variation.option.map( opt => ({
          productVariationId: productVariation.id, 
          optionValueId: opt.optionValueId,                          
          optionId: opt.optionId,         
        }));

        await prisma.productVariationOption.createMany({
          data: productVariationOptions,
        });
      }
  
      console.log('Variations created successfully!');
    } catch (error) {
      console.error('Error creating variations:', error);
      throw error;
    } finally {
      await prisma.$disconnect(); 
    }
  }

export const createProduct = asyncWrapper( async(req: Request, res: Response) => {
    const { productData, variationData } = req.body

    if(!productData || !productData.productName) {
        throw APIError.badRequest('productName is a required in productData')
    }

    const product = await prisma.product.create({
        data: {
            productName: productData.productName,
            storeId: req.user!.storeId,
            description: productData.description,
            baseCategoryId: productData.baseCategoryId,
            images: {
                connect: productData.imageIds?.map((id : string)=> ({id}))
            },
            categories: {
                connect: productData.categoryIds?.map((id: string) => ({id}))
            }
        },
        include: {
            images: true
        }
    })

    await createVariations(product.id, variationData)

    APIResponse.created(res, '', product)

})

export const getAllProducts = asyncWrapper( async(req: Request, res: Response) => { 

    // const { limit, page } = req.params

    // const take = parseInt(limit) || 10
    // const skip = parseInt(page)*take || 0

    const products = await prisma.product.findMany({
        where: {
            storeId: req.user!.storeId
        },
        include: {
          images: true,
          productVariation: true
        }
        // take,
        // skip
    })

    return APIResponse.success(res, '', products)
})

export const updateProduct = asyncWrapper( async(req: Request, res: Response) => {
       
})

