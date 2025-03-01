import multer from "multer";

const MAX_FILE_SIZE = 5*1024*1024

const uploadDocMulter = multer({
    storage: multer.diskStorage({}),
    limits: {
        fileSize: MAX_FILE_SIZE
    }
})

export default uploadDocMulter