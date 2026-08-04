import { getFirebase } from './firebase'

const BUCKET = process.env['FIREBASE_STORAGE_BUCKET'] ?? ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBucket(): any {
  return getFirebase().storage().bucket(BUCKET)
}

export async function getSignedUploadUrl(
  filePath: string,
  contentType: string,
  expiresInMs = 15 * 60 * 1000
): Promise<string> {
  const [url] = await getBucket().file(filePath).getSignedUrl({
    action: 'write',
    expires: Date.now() + expiresInMs,
    contentType,
  })
  return url
}

export async function getSignedReadUrl(
  filePath: string,
  expiresInMs = 7 * 24 * 60 * 60 * 1000
): Promise<string> {
  const [url] = await getBucket().file(filePath).getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMs,
  })
  return url
}

export async function saveBuffer(filePath: string, buffer: Buffer, contentType: string): Promise<void> {
  const file = getBucket().file(filePath)
  await file.save(buffer, { contentType, resumable: false })
}
