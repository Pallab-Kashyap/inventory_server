import { Router } from "express";
import { createProduct, deleteProductImage, getAllProducts, getProductById } from "../controllers/productController";
import { auth } from "../middlewares/authMiddelware";

const router = Router()

router.route('/')
    .get(auth, getAllProducts)
    .post(auth, createProduct)

router.route('/:productId')
    .get(auth, getProductById)

router.route('/:productId/images')
    .delete(auth, deleteProductImage)

export default router