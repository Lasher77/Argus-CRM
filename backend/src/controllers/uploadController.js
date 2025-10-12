const { ZodError } = require('zod');
const env = require('../config/env');
const { ApiError } = require('../utils/apiError');
const { createPresignSchema } = require('../validation/schemas/uploadSchemas');
const { getS3Client, buildPublicUrl } = require('../utils/s3Client');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

exports.createPresignedUpload = async (req, res, next) => {
  try {
    const payload = createPresignSchema.parse(req.body);

    if (!env.S3_BUCKET_NAME) {
      throw new ApiError(500, 'S3 Bucket ist nicht konfiguriert');
    }

    const client = getS3Client();
    const maxFileSize = parseNumber(env.S3_MAX_FILE_SIZE, 20 * 1024 * 1024);
    if (payload.fileSize > maxFileSize) {
      throw new ApiError(413, 'Datei ist zu groß', {
        code: 'FILE_TOO_LARGE',
        details: { maxFileSize },
      });
    }

    const expiresIn = Math.max(60, parseNumber(env.S3_PRESIGN_EXPIRES, 300));
    const uploadPrefix = env.S3_UPLOAD_PREFIX ? `${env.S3_UPLOAD_PREFIX.replace(/\/+$/u, '')}/` : '';
    const scopedPrefix = payload.prefix ? `${payload.prefix.replace(/^\/+|\/+$/gu, '')}/` : '';
    const key = `${uploadPrefix}${scopedPrefix}${Date.now()}-${payload.fileName}`;

    const presign = await createPresignedPost(client, {
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
      Fields: {
        'Content-Type': payload.fileType,
        acl: env.S3_UPLOAD_ACL || 'public-read',
      },
      Conditions: [
        ['content-length-range', 0, maxFileSize],
        { 'Content-Type': payload.fileType },
      ],
      Expires: expiresIn,
    });

    const assetUrl = buildPublicUrl(key);

    res.json({
      success: true,
      data: {
        url: presign.url,
        fields: presign.fields,
        assetUrl,
        expiresIn,
        key,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Anfrageparameter',
        errors: error.errors,
      });
    }

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    console.error('Fehler beim Erzeugen der Upload-Vorlage:', error);
    return res.status(500).json({ success: false, message: 'Upload konnte nicht vorbereitet werden' });
  }
};
