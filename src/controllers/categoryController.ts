import { Request, Response } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import APIError from "../utils/APIError";
import prisma from "../config/prisma";
import APIResponse from "../utils/APIResponse";

export const createCategory = asyncWrapper(async (req: Request, res: Response) => {
  const { categoryName, parentCategoryId } = req.body
  let { displayName } = req.body

  if(!categoryName){
    return APIError.badRequest('category name required')
  }

  if(!displayName){
    displayName = categoryName
  }

  let nestingName = ''

  if(parentCategoryId){
    const parent = await prisma.category.findUnique({
      where: {
        id: parentCategoryId
      },
      select: {
        nestingName: true
      }
    })

    if(!parent){
      throw APIError.notFound('Parent category doesn\'t not found')
    }

    nestingName = parent.nestingName 

    nestingName = nestingName.length === 0 ? categoryName : nestingName + '-' + categoryName
  }

  const category = await prisma.category.create({
    data: {
      categoryName,
      displayName,
      storeId: req.user!.storeId,
      nestingName: nestingName ,
      parentCategoryId
    },
    omit: {
      storeId: true,
      updatedAt: true,
      createdAt: true
    }
  })

   APIResponse.created(res, 'Category created successfully', category)

});  

export const getCategories = asyncWrapper( async(req: Request, res: Response) => {

  const categories = await prisma.category.findMany({
    where: {
      storeId: req.user!.storeId
    },
    omit: {
      storeId: true,
      updatedAt: true,
      createdAt: true
    },
  })

  return APIResponse.success(res, 'Fetched successfully', categories)
})
