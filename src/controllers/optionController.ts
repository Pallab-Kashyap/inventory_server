import { Request, Response } from "express";
import asyncWrapper from "../utils/asyncWrapper";
import APIError from "../utils/APIError";
import prisma from "../config/prisma";
import APIResponse from "../utils/APIResponse";

interface OptionValues {
    optionValue: string
}

export const createOption = asyncWrapper( async(req: Request, res: Response) => {
    const { optionName, optionValues, displayName } = req.body
    
    if(!optionName){
        throw APIError.badRequest('option name required')
    }


    const existOption = await prisma.option.findMany({
        where: {
            optionName,
            storeId: req.user!.storeId
        },
        select: {
            id: true
        }
    })

    if(existOption && existOption.length > 0){
        throw APIError.badRequest('Option with this name already exist')
    }

    let optionVal: OptionValues[] = []

    if(optionValues && optionValues.length > 0){
        optionVal = optionValues.map( (opt: String) => {return { optionValue: opt}})
    }

    const newOption = await prisma.option.create({
        data: {
            optionName,
            displayName: displayName || optionName,
            storeId: req.user!.storeId,
            optionValue: {
                createMany:{ 
                    data: [ ...optionVal ]
                },
            }
        },
        include: {
            optionValue: true
        },
        omit: {
            isActive: true,
            storeId: true,
            createdAt: true,
            updatedAt: true,
        }
    })

    return APIResponse.created(res, 'Create successfully',newOption)

})

export const getOptions = asyncWrapper( async(req: Request, res: Response) => {

    const options = await prisma.option.findMany({
        where: {
            storeId: req.user!.storeId
        },
        include: {
            optionValue: true
        }
    })

    return APIResponse.success(res, '', options)
})