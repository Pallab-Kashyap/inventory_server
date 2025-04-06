import { Router } from "express";
import { auth } from "../middlewares/authMiddelware";
import { getProductVariations } from "../controllers/variationController";

const router = Router()

router.route('/:productId')
    .get(auth, getProductVariations)

export default router