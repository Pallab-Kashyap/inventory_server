import { Request, Response } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import APIError from "../utils/APIError";
import prisma from "../config/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import APIResponse from "../utils/APIResponse";
import {v4 as uuidv4} from 'uuid'
import { Prisma } from "@prisma/client";

interface Option {
  optionId: string,
  optionValueId: string
}

interface Variation { 
  variationName: string
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

// const encodeAndDecodeCursor = () => {

// }

const createVariations = async (
  tx: Prisma.TransactionClient,
  productId: string,
  productVariationList: Variation[]
) => {
  const generatedVariations = productVariationList.map((variation) => {
    const variationId = uuidv4();

    return {
      id: variationId,
      variationName: variation.variationName,
      stockQuantity: variation.stock,
      price: variation.costPerUnit,
      isActive: true,
      isSellable: true,
      productId,
      imageIds: variation.image,
    };
  });

  const productVariationOptions: {
    productVariationId: string;
    optionId: string;
    optionValueId: string;
  }[] = [];

  for (const variation of generatedVariations) {
    const original = productVariationList.find(v => v.variationName === variation.variationName)!;

    for (const opt of original.option) {
      productVariationOptions.push({
        productVariationId: variation.id,
        optionId: opt.optionId,
        optionValueId: opt.optionValueId,
      });
    }
  }

  await tx.productVariation.createMany({
    data: generatedVariations.map(v => ({
      id: v.id,
      variationName: v.variationName,
      stockQuantity: v.stockQuantity,
      price: v.price,
      sku: `SKU-${v.id.slice(0, 6)}`,
      productId: v.productId,
      isActive: v.isActive,
      isSellable: v.isSellable,
    })),
  });

  // Update image connections

  await tx.productVariationOption.createMany({
    data: productVariationOptions,
  });
  await Promise.all(generatedVariations.map(variation =>{

    if(variation.imageIds?.length){
    
      prisma.productVariation.update({
          where: { id: variation.id },
          data: {
            images: {
              connect: variation.imageIds.map(id => ({ id })),
            },
          },
        })
      }
      }
      ));
};


export const createProduct = asyncWrapper(async (req: Request, res: Response) => {
  const { productData, variationData } = req.body;

  if (!productData || !productData.productName) {
    throw APIError.badRequest('productName is required in productData');
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create product
    const product = await tx.product.create({
      data: {
        productName: productData.productName,
        storeId: req.user!.storeId,
        description: productData.description,
        baseCategoryId: productData.baseCategoryId,
        images: {
          connect: productData.imageIds?.map((id: string) => ({ id })),
        },
        categories: {
          connect: productData.categoryIds?.map((id: string) => ({ id })),
        },
      },
      include: {
        images: true,
      },
    });

    // 2. If variations exist, call variation creation
    if (variationData && variationData.length > 0) {
      await createVariations(tx, product.id, variationData);
    }

    return product;
  } ,{
    timeout: 20000, // timeout in milliseconds (e.g., 20 seconds)
    maxWait: 5000, // how long to wait for the db to become available
  })

  APIResponse.created(res, '', result);
});


export const getAllProducts = asyncWrapper( async(req: Request, res: Response) => { 

    const { limit } = req.params

    const take = parseInt(limit) || 10
    const cursor = req.query.cursor as string | undefined;

    const products = await prisma.product.findMany({
        where: {
            storeId: req.user!.storeId
        },
        include: {
          images: true,
          productVariation: true
        },
        take,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1
        }),
        orderBy: { id: 'asc'}
    })

    return APIResponse.success(res, '', products)
})

export const updateProduct = asyncWrapper( async(req: Request, res: Response) => {
       
})

