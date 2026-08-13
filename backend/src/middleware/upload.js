const path = require('path');
const fs = require('fs');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const uploadRoot = path.join(__dirname, '..', '..', env.UPLOAD_DIR);

// Kichik papkalarni yaratish
['avatars', 'questions'].forEach((sub) => {
  const dir = path.join(uploadRoot, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function makeStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(uploadRoot, subfolder)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${subfolder}-${unique}${ext}`);
    },
  });
}

function imageFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new ApiError(400, 'Faqat rasm fayllari ruxsat etiladi (jpeg, png, webp, gif, svg)'));
}

function createUploader(subfolder) {
  return multer({
    storage: makeStorage(subfolder),
    fileFilter: imageFilter,
    limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  });
}

module.exports = {
  uploadAvatar: createUploader('avatars').single('avatar'),
  uploadQuestionImage: createUploader('questions').single('image'),
  uploadRoot,
};
