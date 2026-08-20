import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "products"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        uploadDirectory
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const extension =
        path.extname(
          file.originalname
        );

      const baseName =
        path
          .basename(
            file.originalname,
            extension
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          );

      const uniqueName =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}`;

      cb(
        null,
        `${baseName}-${uniqueName}${extension}`
      );
    },
  });

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (
    allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    const error =
      new Error(
        "Only JPEG, PNG, WEBP, and GIF images are allowed"
      );

    error.statusCode = 400;

    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },
});

export default upload;