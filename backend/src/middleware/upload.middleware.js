import multer from "multer";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25mb

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        cb(null, true);
    },
});
