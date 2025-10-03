import { existsSync } from 'fs'
import * as fsPromises from 'fs/promises'
import { join } from 'path'

// Public directory served by Next.js
export const PUBLIC_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'walkthrough-photos')
// Persistent volume root (if mounted in production)
export const DATA_ROOT = '/data'
export const DATA_UPLOAD_DIR = join(DATA_ROOT, 'uploads', 'walkthrough-photos')

export interface SavedFileMeta {
  filename: string
  filepath: string // public URL path
  filesize: number
  mimetype: string
}

export async function saveUploadedFilesDual(files: File[]): Promise<SavedFileMeta[]> {
  if (!existsSync(PUBLIC_UPLOAD_DIR)) {
    await fsPromises.mkdir(PUBLIC_UPLOAD_DIR, { recursive: true })
  }
  const haveDataVolume = existsSync(DATA_ROOT)
  if (haveDataVolume && !existsSync(DATA_UPLOAD_DIR)) {
    try { await fsPromises.mkdir(DATA_UPLOAD_DIR, { recursive: true }) } catch { /* ignore */ }
  }

  const out: SavedFileMeta[] = []
  for (const file of files) {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop() || 'jpg'
    const uniqueFilename = `${timestamp}-${randomSuffix}.${extension}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const publicFilePath = join(PUBLIC_UPLOAD_DIR, uniqueFilename)
    await fsPromises.writeFile(publicFilePath, buffer)
    if (haveDataVolume) {
      const dataFilePath = join(DATA_UPLOAD_DIR, uniqueFilename)
      try { await fsPromises.writeFile(dataFilePath, buffer) } catch (e) { console.warn('Persistent write failed (non-fatal):', e) }
    }
    out.push({
      filename: file.name,
      filepath: `/api/uploads/walkthrough-photos/${uniqueFilename}`,
      filesize: file.size,
      mimetype: file.type,
    })
  }
  return out
}
