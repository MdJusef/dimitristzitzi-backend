const multer = require("multer");
const path = require("path");

const configureFileUpload = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg"
      ) {
        cb(null, path.join(__dirname, "../public/uploads/images"));
      } else if (
        file.mimetype === "video/mp4" ||
        file.mimetype === "video/mkv" ||
        file.mimetype === "video/avi"
      ) {
        cb(null, path.join(__dirname, "../public/uploads/videos"));
      } else {
        cb(new Error("Invalid file type"));
      }
    },
    filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname;
      cb(null, name);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedFieldnames = [
      "productImage",
      "image",
      "categoryImage",
      "videoFile",
    ];

    if (file.fieldname === undefined) {
      // Allow requests without any files
      cb(null, true);
    } else if (allowedFieldnames.includes(file.fieldname)) {
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "video/mp4" ||
        file.mimetype === "video/mkv" ||
        file.mimetype === "video/avi"
      ) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"));
      }
    } else {
      cb(new Error("Invalid fieldname"));
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
  }).fields([
    { name: "productImage", maxCount: 10 },
    { name: "image", maxCount: 1 },
    { name: "categoryImage", maxCount: 1 },
    { name: "videoFile", maxCount: 1 }, // Allow up to 5 video files
  ]);

  return upload;
};

module.exports = configureFileUpload;
