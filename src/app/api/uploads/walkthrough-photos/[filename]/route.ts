import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { constants } from 'fs'

// Serve uploaded files from persistent volume or fallback to public
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    
    // Validate filename (prevent directory traversal)
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    // Try persistent volume first (/data/uploads/walkthrough-photos)
    const persistentPath = `/data/uploads/walkthrough-photos/${filename}`
    try {
      await access(persistentPath, constants.F_OK)
      const fileBuffer = await readFile(persistentPath)
      
      // Determine content type from extension
      const extension = filename.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg'
          break
        case 'png':
          contentType = 'image/png'
          break
        case 'gif':
          contentType = 'image/gif'
          break
        case 'webp':
          contentType = 'image/webp'
          break
      }

      return new NextResponse(fileBuffer as BodyInit, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // 1 year
        },
      })
    } catch (persistentError) {
      // Fallback to public directory
      const publicPath = join(process.cwd(), 'public', 'uploads', 'walkthrough-photos', filename)
      try {
        await access(publicPath, constants.F_OK)
        const fileBuffer = await readFile(publicPath)
        
        const extension = filename.split('.').pop()?.toLowerCase()
        let contentType = 'application/octet-stream'
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg'
            break
          case 'png':
            contentType = 'image/png'
            break
          case 'gif':
            contentType = 'image/gif'
            break
          case 'webp':
            contentType = 'image/webp'
            break
        }

        return new NextResponse(fileBuffer as BodyInit, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
          },
        })
      } catch (publicError) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    }
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}