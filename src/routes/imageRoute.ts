import { Router } from "express";
import { getAllImages, uploadImage } from "../controllers/imageController";
import { auth } from "../middlewares/authMiddelware";
import upload from "../middlewares/multer";

const router = Router()

router.route('/')
    .get(auth, getAllImages)
    .post(auth, upload.single('image'), uploadImage)

export default router