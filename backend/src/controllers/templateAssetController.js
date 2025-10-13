const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const multer = require('multer');
const { ApiError } = require('../utils/apiError');

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/svg+xml']);

const assetDir = path.join(__dirname, '../../data/template-assets');
if (!fs.existsSync(assetDir)) {
  fs.mkdirSync(assetDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, assetDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuid()}${ext.toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Nur PNG, JPEG oder SVG-Dateien sind erlaubt', { code: 'INVALID_FILE_TYPE' }));
    }
  }
}).single('asset');

const listAssets = (_req, res) => {
  const files = fs.readdirSync(assetDir);
  const items = files
    .filter((file) => !file.startsWith('.'))
    .map((file) => {
      const stats = fs.statSync(path.join(assetDir, file));
      return {
        url: `/api/template-assets/${file}`,
        fileName: file,
        size: stats.size,
        createdAt: stats.birthtime
      };
    });

  res.json({ success: true, data: items });
};

const uploadAsset = (req, res) => {
  upload(req, res, (error) => {
    if (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          ...(error.details ? { details: error.details } : {})
        });
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'Datei überschreitet die maximale Größe von 5 MB'
        });
      }

      console.error('Upload fehlgeschlagen:', error);
      return res.status(500).json({ success: false, message: 'Datei konnte nicht hochgeladen werden' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Keine Datei übermittelt' });
    }

    return res.status(201).json({
      success: true,
      data: {
        url: `/api/template-assets/${req.file.filename}`,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  });
};

module.exports = {
  listAssets,
  uploadAsset
};
