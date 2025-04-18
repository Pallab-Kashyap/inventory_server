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

interface VariationInput {
  id?: string; // optional – if undefined, it’s a new variation
  variationName: string;
  stock: number;
  costPerUnit: number;
  isSellable: boolean;
  sku?: string;
  images: string[]; // array of image IDs
}

interface UpdateProductVariations {
  productId: string,
  updatedVariations: VariationInput[]
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

const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;

  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => deepEqual(a[key], b[key]));
}



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
          baseCategory: true,
          productVariation: {
            include: {
              images: true,
              option: {
                include: {
                  option: true,
                  optionValue: true
                }
              }
            }
          },
        },
        take,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1
        }),
        orderBy: { id: 'asc'}
    })

    const newCursor = products[products.length - 1]?.id

    return APIResponse.success(res, '', { products, cursor: newCursor})
});

export const getProductById = asyncWrapper( async(req: Request, res: Response) => {
  const { productId } = req.params

    const product = await prisma.product.findUnique({
        where: {
            id: productId,
            storeId: req.user!.storeId
        },
        include: {
          images: true,
          productVariation: {
            include: {
              images: true,
              option: {
                include: {
                  option: true,
                  optionValue: true
                }
              }
            }
          },
        },
    })

    return APIResponse.success(res, '', product)
});

// export const updateProductVariations = asyncWrapper(async (req: Request, res: Response) => {


//   const {productId, updatedVariations} = req.body

//   const existingVariations = await prisma.productVariation.findMany({
//     where: {
//       productId,
//       isDeleted: false,
//     },
//     select: { id: true },
//   });

//   const existingVariationIds = existingVariations.map(v => v.id);
//   const updatedVariationIds = updatedVariations.map(v => v.id).filter(Boolean) as string[];

//   const variationsToDelete = existingVariationIds.filter(id => !updatedVariationIds.includes(id));
//   const variationsToUpdate = updatedVariations.filter(v => v.id && existingVariationIds.includes(v.id));
//   const variationsToCreate = updatedVariations.filter(v => !v.id);

//   await prisma.$transaction(async (tx) => {
//     // 1. Soft delete removed variations
//     await Promise.all(
//       variationsToDelete.map(id =>
//         tx.productVariation.update({
//           where: { id },
//           data: { isDeleted: true },
//         })
//       )
//     );

//     // 2. Update existing variations
//     await Promise.all(
//       variationsToUpdate.map(variation =>
//         tx.productVariation.update({
//           where: { id: variation.id! },
//           data: {
//             variationName: variation.variationName,
//             stockQuantity: variation.stock,
//             price: variation.costPerUnit,
//             isSellable: variation.isSellable,
//             sku: variation.sku ?? `SKU-${variation.id!.slice(0, 6)}`,
//             images: {
//               set: variation.images.map(imageId => ({ id: imageId })),
//             },
//           },
//         })
//       )
//     );

//     // 3. Create new variations
//     await Promise.all(
//       variationsToCreate.map(variation =>
//         tx.productVariation.create({
//           data: {
//             id: uuidv4(),
//             productId,
//             variationName: variation.variationName,
//             stockQuantity: variation.stock,
//             price: variation.costPerUnit,
//             isSellable: variation.isSellable,
//             isActive: true,
//             isDeleted: false,
//             // sku: `SKU-${uuidv4().slice(0, 6)}`,
//             images: {
//               connect: variation.images.map(imageId => ({ id: imageId })),
//             },
//           },
//         })
//       )
//     );
//   });
// });

export const updateProductVariations2 = asyncWrapper(async (req: Request<{}, {}, UpdateProductVariations>, res: Response) => {
  const {productId, updatedVariations} = req.body 
  const existingVariations = await prisma.productVariation.findMany({
    where: {
      productId,
      isDeleted: false,
    },
    select: { id: true },
  });
  
  const existingVariationIds = existingVariations.map(v => v.id);
  const updatedVariationIds = updatedVariations
    .map(v => v.id)
    .filter(Boolean) as string[];
  
  const variationsToDelete = existingVariationIds.filter(id => !updatedVariationIds.includes(id));
  const variationsToUpdate = updatedVariations.filter(v => v.id && existingVariationIds.includes(v.id));
  const variationsToCreate = updatedVariations.filter(v => !v.id);
  
  await prisma.$transaction(async (tx) => {
    // 1. Soft delete removed variations - batch operation
    if (variationsToDelete.length > 0) {
      await tx.productVariation.updateMany({
        where: { 
          id: { in: variationsToDelete },
          productId // Extra safety check
        },
        data: { isDeleted: true }
      });
    }
    
    // 2. Handle updates
    if (variationsToUpdate.length > 0) {
      // 2a. Update basic fields in batches where possible
      const basicUpdateMap = new Map<string, string[]>();
      
      for (const variation of variationsToUpdate) {
        const updateData = {
          variationName: variation.variationName,
          stockQuantity: variation.stock,
          price: variation.costPerUnit,
          isSellable: variation.isSellable,
          sku: variation.sku ?? `SKU-${variation.id!.slice(0, 6)}`
        };
        
        const key = JSON.stringify(updateData);
        if (!basicUpdateMap.has(key)) {
          basicUpdateMap.set(key, []);
        }
        basicUpdateMap.get(key)!.push(variation.id!);
      }
      
      // Execute batch updates
      const basicUpdatePromises = Array.from(basicUpdateMap.entries()).map(
        ([dataJson, ids]) => 
          tx.productVariation.updateMany({
            where: { id: { in: ids } },
            data: JSON.parse(dataJson)
          })
      );
      
      await Promise.all(basicUpdatePromises);
      
      // 2b. Handle image relationships separately
      const imageUpdatePromises = variationsToUpdate.map(variation => 
        tx.productVariation.update({
          where: { id: variation.id! },
          data: {
            images: {
              set: variation.images.map(imageId => ({ id: imageId }))
            }
          }
        })
      );
      
      await Promise.all(imageUpdatePromises);
    }
    
    // 3. Create new variations
    if (variationsToCreate.length > 0) {
      // 3a. First create the variations without images
      const newVariationsData = variationsToCreate.map(variation => ({
        id: uuidv4(),
        productId,
        variationName: variation.variationName,
        stockQuantity: variation.stock,
        price: variation.costPerUnit,
        isSellable: variation.isSellable,
        isActive: true,
        isDeleted: false,
        sku: variation.sku ?? `SKU-${uuidv4().slice(0, 6)}`
      }));
      
      await tx.productVariation.createMany({
        data: newVariationsData
      });
      
      // 3b. Retrieve the newly created variations to get their IDs
      const newVariations = await tx.productVariation.findMany({
        where: {
          productId,
          id: { 
            in: newVariationsData.map(v => v.id) 
          }
        },
        select: { id: true }
      });
      
      // 3c. Connect images to each variation
      const imageConnectPromises = newVariations.map((newVar, index) => {
        const imageIds = variationsToCreate[index].images;
        if (!imageIds.length) return Promise.resolve();
        
        return tx.productVariation.update({
          where: { id: newVar.id },
          data: {
            images: {
              connect: imageIds.map(imgId => ({ id: imgId }))
            }
          }
        });
      });
      
      await Promise.all(imageConnectPromises);
    }
  });
});

export const deleteProductImage = asyncWrapper( async(req: Request, res: Response) => {
  const { productId } = req.params
  const { images } = req.body

  if(!productId){
    throw APIError.badRequest('productId is required in params')
  }

  if(!images){
    throw APIError.badRequest('Image ID is required in images array')
  }

  if(images.length === 0){
    return APIResponse.success(res, 'Images successfully removed', null)
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      images: {
        disconnect: images.map((id: string) => ({id}))
      }
    }
  })

  return APIResponse.success(res, 'Images successfully removed', null)
})