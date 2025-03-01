import { Router } from "express";
import { createOption, getOptions } from "../controllers/optionController";
import { auth } from "../middlewares/authMiddelware";

const router = Router()

router.route('/')
    .get(auth, getOptions)
    .post(auth, createOption)

export default router