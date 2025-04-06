import { Request, Response } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import APIError from "../utils/APIError";
import prisma from "../config/prisma";
import APIResponse from "../utils/APIResponse";

/// The raw category type returned by Prisma
interface RawCategory {
  id: string;
  categoryName: string;
  displayName: string;
  nestingName: string;
  isActive: boolean;
  parentCategoryId: string | null;
}

// What you transform it into
interface CategoryTree extends RawCategory {
  children: CategoryTree[];
}

function buildCategoryTree(categories: RawCategory[]): CategoryTree[] {
  const categoryMap: { [id: string]: CategoryTree } = {};

  // Step 1: Initialize categoryMap with children: []
  categories.forEach((cat) => {
    categoryMap[cat.id] = { ...cat, children: [] };
  });

  const tree: CategoryTree[] = [];

  // Step 2: Link children to their parents
  categories.forEach((cat) => {
    if (cat.parentCategoryId) {
      const parent = categoryMap[cat.parentCategoryId];
      if (parent) {
        parent.children.push(categoryMap[cat.id]);
      }
    } else {
      tree.push(categoryMap[cat.id]);
    }
  });

  return tree;
}



export const createCategory = asyncWrapper(async (req: Request, res: Response) => {
  const { categoryName, parentCategoryId, displayName } = req.body

  if(!categoryName || !displayName){
    return APIError.badRequest('categoryName and displayName are required')
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
      throw APIError.notFound('Parent category not found')
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
    select: {
      id: true,
      categoryName: true,
      displayName: true,
      nestingName: true,
      isActive: true,
      parentCategoryId: true,
    },
  });

  // Transform the flat list into a tree structure.
  const categoryTree = buildCategoryTree(categories);

  // Send the hierarchical response.
  return APIResponse.success(res, 'Fetched successfully', categoryTree);
})
