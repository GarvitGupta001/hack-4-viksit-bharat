const multer = require("multer");

// Use memory storage to get buffer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (
        file.mimetype.startsWith("image/") ||
        file.mimetype === "application/pdf"
    ) {
        cb(null, true);
    } else {
        cb(new Error("Only image and PDF files are allowed!"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

module.exports = upload;
