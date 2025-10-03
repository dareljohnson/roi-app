import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs/promises'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id
    
    if (!photoId) {
      return NextResponse.json(
        { error: 'Invalid photo ID' },
        { status: 400 }
      )
    }

    // Find the photo to get the file path
    const photo = await prisma.walkThroughPhoto.findUnique({
      where: { id: photoId }
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Delete the photo from the database
    await prisma.walkThroughPhoto.delete({
      where: { id: photoId }
    })

    // Delete the file from the filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', photo.filepath)
      await fs.unlink(filePath)
    } catch (fileError) {
      // Log the error but don't fail the request - the database record is already deleted
      console.warn('Failed to delete physical file:', fileError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}