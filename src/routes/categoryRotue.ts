import { Router } from "express";
import { auth } from "../middlewares/authMiddelware";
import { createCategory, getCategories, getSubCategories } from "../controllers/categoryController";

const router = Router()

router.route('/')
    .get(auth, getCategories)
    .post(auth, createCategory)

router.get('/sub-categories/:categoryId', auth, getSubCategories)

export default router