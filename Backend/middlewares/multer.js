import multer from "multer";
const storage = multer.memoryStorage();

export const multipleUpload = multer({ storage }).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "resume", maxCount: 1 },
]);

// Add single upload middleware for handling company logo uploads
export const singleUpload = multer({ storage }).single('file');

export default multipleUpload;
