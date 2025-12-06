const fs = require('fs');
const path = require('path');

// Provider-agnostic storage scaffold
// By default this writes to local filesystem using UPLOAD_DIR env var.
// To enable S3 or Vercel Blob, implement the upload/download/delete methods below.

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (e) { /* ignore */ }
}

async function saveFile(fileStream, filename) {
  const dest = path.join(UPLOAD_DIR, filename);
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    fileStream.pipe(out);
    out.on('finish', () => resolve(dest));
    out.on('error', reject);
  });
}

async function getFilePath(filename) {
  const p = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(p)) return p;
  throw new Error('File not found');
}

async function deleteFile(filename) {
  const p = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    return true;
  }
  return false;
}

module.exports = { saveFile, getFilePath, deleteFile };
const fs = require('fs');
const path = require('path');

// Provider-agnostic storage scaffold.
// Supports local disk by default. To add S3 or Vercel Blob, implement the
// upload/download/delete methods using the chosen provider SDK and swap
// in production via configuration.

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (err) { /* ignore */ }
}

async function saveLocal(fileBuffer, filename) {
  const dest = path.join(UPLOAD_DIR, filename);
  await fs.promises.writeFile(dest, fileBuffer);
  return { path: dest, url: `/uploads/${filename}` };
}

async function deleteLocal(filename) {
  const dest = path.join(UPLOAD_DIR, filename);
  try { await fs.promises.unlink(dest); return true; } catch (err) { return false; }
}

module.exports = {
  // upload: (buffer, filename) => save to configured provider
  upload: async (buffer, filename) => {
    // If S3/Vercel Blob env vars are present, implement provider logic here.
    return saveLocal(buffer, filename);
  },
  delete: async (filename) => deleteLocal(filename),
  // download: return a read stream or buffer
  download: async (filename) => {
    const dest = path.join(UPLOAD_DIR, filename);
    return fs.createReadStream(dest);
  }
};
/*
  Storage scaffold: provider-agnostic interface for uploads.
  Implementations: local (default), S3, Vercel Blob.
  Usage: const storage = require('../utils/storage'); await storage.saveFile(stream, filename);
  Environment variables for S3 (when enabled): S3_BUCKET, S3_REGION, S3_KEY, S3_SECRET
*/
const fs = require('fs');
const path = require('path');

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

async function saveFile(streamOrBuffer, filename) {
  const dest = path.join(uploadDir, filename);
  if (streamOrBuffer && typeof streamOrBuffer.pipe === 'function') {
    const out = fs.createWriteStream(dest);
    return new Promise((resolve, reject) => {
      streamOrBuffer.pipe(out).on('finish', () => resolve(dest)).on('error', reject);
    });
  }
  // buffer
  await fs.promises.writeFile(dest, streamOrBuffer);
  return dest;
}

async function getFilePath(filename) {
  const p = path.join(uploadDir, filename);
  if (fs.existsSync(p)) return p;
  return null;
}

module.exports = { saveFile, getFilePath };
/*
  Storage scaffold: provider-agnostic helpers for uploads
  Supports: 's3' (AWS S3) or 'vercel' (Vercel Blob) by setting `STORAGE_PROVIDER` env var.
  This file is a scaffold — it does not enable any provider by default.

  Required env vars when using S3:
    - STORAGE_PROVIDER=s3
    - S3_BUCKET
    - S3_REGION
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY

  When using Vercel Blob set:
    - STORAGE_PROVIDER=vercel
    - VERCEL_BLOB_TOKEN

  Usage: const { uploadFile, getFileUrl } = require('./utils/storage');
*/
const fs = require('fs');
const path = require('path');

const provider = process.env.STORAGE_PROVIDER || 'local';

async function uploadFile({ buffer, filename, mimeType }) {
  if (provider === 's3') {
    // Implement S3 upload when credentials are provided.
    throw new Error('S3 upload not implemented in scaffold. Add aws-sdk & implementation.');
  }

  if (provider === 'vercel') {
    // Implement Vercel Blob upload using Vercel Blob API when configured.
    throw new Error('Vercel Blob upload not implemented in scaffold. Add implementation when ready.');
  }

  // Local fallback: write into UPLOAD_DIR (ensure this is not used in production)
  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const dest = path.join(uploadDir, filename);
  fs.writeFileSync(dest, buffer);
  return { url: `/uploads/${filename}`, path: dest };
}

function getFileUrl(record) {
  if (provider === 's3') return `s3://${process.env.S3_BUCKET}/${record.key}`;
  if (provider === 'vercel') return record.url;
  return `/uploads/${path.basename(record.path || record)}`;
}

module.exports = { uploadFile, getFileUrl };
