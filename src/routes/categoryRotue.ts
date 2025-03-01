import { Router } from "express";
import { auth } from "../middlewares/authMiddelware";
import { createCategory, getCategories } from "../controllers/categoryController";

const router = Router()

router.route('/')
    .get(auth, getCategories)
    .post(auth, createCategory)

export default router