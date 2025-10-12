const { S3Client } = require('@aws-sdk/client-s3');
const env = require('../config/env');

let client;

const resolveRegion = () => {
  if (env.AWS_REGION) {
    return env.AWS_REGION;
  }
  if (env.AWS_DEFAULT_REGION) {
    return env.AWS_DEFAULT_REGION;
  }
  throw new Error('AWS Region ist nicht konfiguriert');
};

exports.getS3Client = () => {
  if (client) {
    return client;
  }

  const region = resolveRegion();
  const config = { region };

  if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    };
  }

  client = new S3Client(config);
  return client;
};

exports.buildPublicUrl = (key) => {
  const baseUrl = env.S3_PUBLIC_BASE_URL;
  if (baseUrl) {
    return `${baseUrl.replace(/\/+$/u, '')}/${key}`;
  }

  const region = env.AWS_REGION || env.AWS_DEFAULT_REGION || 'eu-central-1';
  return `https://${env.S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
};
