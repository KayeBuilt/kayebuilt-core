import crypto from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { put as blobPut } from '@vercel/blob';

/**
 * Object storage with three modes (auto-selected from env), matching the
 * pattern already proven in permit-pipeline (packages/core/src/storage.ts):
 * - S3 mode: any S3-compatible bucket (R2, S3) when S3_BUCKET + S3_ACCESS_KEY_ID are set.
 * - Blob mode: Vercel Blob when BLOB_READ_WRITE_TOKEN is set. Blobs are public with
 *   unguessable random-suffix URLs; the blob URL itself is stored as the asset key.
 * - Disk mode (local dev fallback): files under LOCAL_STORAGE_DIR (default
 *   <repo>/.storage), served via a GET /files route with an HMAC-signed
 *   expiring URL. Lets the full app run with zero cloud accounts.
 */
type StorageMode = 's3' | 'blob' | 'disk';

function mode(): StorageMode {
  if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) return 's3';
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'blob';
  return 'disk';
}

export function diskMode(): boolean {
  return mode() === 'disk';
}

function localDir(): string {
  return process.env.LOCAL_STORAGE_DIR || path.resolve(process.cwd(), '.storage');
}

function localPath(key: string): string {
  const resolved = path.resolve(localDir(), key);
  if (!resolved.startsWith(path.resolve(localDir()))) throw new Error('Invalid storage key');
  return resolved;
}

function signingSecret(): string {
  return process.env.FILE_SIGNING_SECRET || 'dev-secret';
}

export function fileSignature(key: string, expires: number): string {
  return crypto.createHmac('sha256', signingSecret()).update(`${key}:${expires}`).digest('hex');
}

let _client: S3Client | null = null;

function client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return _client;
}

function bucket(): string {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error('S3_BUCKET is not set');
  return b;
}

/**
 * Stores an object and returns its storage key. Callers must persist the
 * returned value (in blob mode it is the full blob URL, not the input key).
 */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  switch (mode()) {
    case 'disk': {
      const file = localPath(key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, body);
      return key;
    }
    case 'blob': {
      const blob = await blobPut(key, body, {
        access: 'public',
        contentType,
        addRandomSuffix: true,
      });
      return blob.url;
    }
    case 's3': {
      await client().send(
        new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }),
      );
      return key;
    }
  }
}

export async function getObject(key: string): Promise<Buffer> {
  if (key.startsWith('http')) {
    const res = await fetch(key);
    if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (diskMode()) {
    return readFile(localPath(key));
  }
  const res = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  const bytes = await res.Body?.transformToByteArray();
  return Buffer.from(bytes ?? new Uint8Array());
}

/** Short-lived signed URL for previews and downloads. */
export async function signedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  // Blob-mode keys are already unguessable public URLs.
  if (key.startsWith('http')) return key;
  if (diskMode()) {
    const base = process.env.APP_BASE_URL ?? 'http://localhost:3001';
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const sig = fileSignature(key, expires);
    return `${base}/files?key=${encodeURIComponent(key)}&expires=${expires}&sig=${sig}`;
  }
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket(), Key: key }), {
    expiresIn: expiresInSeconds,
  });
}
