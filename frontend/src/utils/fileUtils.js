export const dataUrlToBlob = async (dataUrl) => {
  if (!dataUrl.startsWith('data:')) {
    throw new Error('Nur Data-URLs können konvertiert werden');
  }
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('Data-URL konnte nicht gelesen werden');
  }
  return response.blob();
};

export const getExtensionFromMime = (mimeType) => {
  if (!mimeType) {
    return 'bin';
  }
  if (mimeType === 'image/png') {
    return 'png';
  }
  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }
  if (mimeType === 'image/svg+xml') {
    return 'svg';
  }
  if (mimeType === 'image/webp') {
    return 'webp';
  }
  return mimeType.split('/').pop() || 'bin';
};

export const createFileName = (prefix, extension) => {
  const normalizedPrefix = prefix.replace(/[^a-z0-9/_-]/gi, '-').replace(/-+/g, '-');
  return `${normalizedPrefix}-${Date.now()}.${extension}`;
};

export const ensureUrlHasProtocol = (value) => {
  if (!value) {
    return value;
  }
  if (/^https?:/i.test(value) || value.startsWith('data:')) {
    return value;
  }
  return `https://${value}`;
};
