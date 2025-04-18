import { Router } from "express";
import { auth } from "../middlewares/authMiddelware";
import { getVariations } from "../controllers/variationController";

const router = Router()

router.route('/:productId')
    .get(auth, getVariations)

export default router