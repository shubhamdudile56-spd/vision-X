/**
 * In-memory upload handling.
 *
 * Files never touch the filesystem: multer keeps them on a Buffer, we verify
 * both the declared MIME type AND the real magic bytes, and the buffer is
 * discarded as soon as the response is sent.
 */
import multer from 'multer';
import { badRequest, payloadTooLarge } from '../utils/errors.js';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAGIC_BYTES = [
  { mime: 'image/jpeg', test: (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff },
  {
    mime: 'image/png',
    test: (buf) =>
      buf.length > 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
  },
  {
    mime: 'image/webp',
    test: (buf) =>
      buf.length > 12 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
  }
];

export function detectImageMime(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  return MAGIC_BYTES.find((entry) => entry.test(buffer))?.mime ?? null;
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 10,
    fieldSize: 1024 * 1024
  },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(badRequest(`Unsupported file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }
    return cb(null, true);
  }
});

/** Single-file middleware under the field name `image`. */
export const uploadImage = upload.single('image');

/** Runs after multer: re-validates the bytes and guarantees a usable buffer. */
export function assertValidImage(req, _res, next) {
  const file = req.file;
  if (!file) return next(badRequest('No image file received. Attach a file under the "image" field.'));
  if (file.size > MAX_UPLOAD_BYTES) return next(payloadTooLarge('File exceeds the 10MB upload limit'));

  const detected = detectImageMime(file.buffer);
  if (!detected) return next(badRequest('File content is not a valid JPEG, PNG, or WebP image'));
  if (detected !== file.mimetype) {
    return next(badRequest(`File content (${detected}) does not match the declared type (${file.mimetype})`));
  }
  if (file.size < 64) return next(badRequest('Image data appears truncated'));

  req.detectedMime = detected;
  return next();
}

export default { uploadImage, assertValidImage, detectImageMime, MAX_UPLOAD_BYTES, ALLOWED_MIME_TYPES };
