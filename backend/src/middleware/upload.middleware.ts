import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// יוצר את תיקיות ההעלאה פעם אחת בטעינת המודול אם הן חסרות
// (כי .gitignore מחריג את התוכן ולכן הן לא מגיעות לפרודקשן)
const UPLOAD_DIRS = ['uploads/posts', 'uploads/profiles', 'uploads/covers'];
UPLOAD_DIRS.forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

const storage = multer.diskStorage({
  destination: function (_req, file, cb) {
    if (file.fieldname === 'image') {
      cb(null, 'uploads/posts/');
    } else if (file.fieldname === 'profileImage') {
      cb(null, 'uploads/profiles/');
    } else if (file.fieldname === 'coverImage') {
      cb(null, 'uploads/covers/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

export default upload;
