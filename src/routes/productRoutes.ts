import { Router } from "express";
import { createProduct, getAllProducts } from "../controllers/productController";
import { auth } from "../middlewares/authMiddelware";

const router = Router()

router.route('/')
    .get(auth, getAllProducts)
    .post(auth, createProduct)

export default router