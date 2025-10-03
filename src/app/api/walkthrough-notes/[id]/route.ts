import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { WalkThroughNoteSchema, WalkThroughNoteUpdateSchema } from '@/types/walkthrough'
import fs from 'fs/promises'
import path from 'path'

// GET /api/walkthrough-notes/[id] - Get a specific walk-through note
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Admins can access any note, users only their own
    const isAdmin = (session.user as any).role === 'ADMIN'
    const whereClause = isAdmin 
      ? { id: params.id }
      : { 
          id: params.id,
          user: {
            email: session.user.email
          }
        }

    const note = await prisma.walkThroughNote.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        property: {
          select: {
            address: true
          }
        },
        photos: {
          orderBy: {
            order: 'asc'
          }
        }
      } as any
    })

    if (!note) {
      return NextResponse.json({
        success: false,
        error: 'Walk-through note not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      note
    })

  } catch (error) {
    console.error('Error fetching walk-through note:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT /api/walkthrough-notes/[id] - Update a walk-through note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = WalkThroughNoteUpdateSchema.parse(body)

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Verify note exists and is accessible
    const isAdmin = (session.user as any).role === 'ADMIN'
    const noteWhereClause = isAdmin 
      ? { id: params.id }
      : { id: params.id, userId: user.id }

    const existingNote = await prisma.walkThroughNote.findFirst({
      where: noteWhereClause
    })

    if (!existingNote) {
      return NextResponse.json({
        success: false,
        error: 'Walk-through note not found'
      }, { status: 404 })
    }

    // Handle photo updates if provided
    const updateData: any = {
      title: validatedData.title,
      content: validatedData.content,
      rating: validatedData.rating
    }

    // If photos are provided, intelligently update them
    if (validatedData.photos) {
      // Get existing photos
      const existingPhotos = await (prisma as any).walkThroughPhoto.findMany({
        where: { noteId: params.id }
      }) || []

      // Separate existing photos from new photos
      const existingPhotoIds = existingPhotos.map((p: any) => p.id)
      const updatedPhotoIds = validatedData.photos
        .filter(p => p.id)
        .map(p => p.id)
      const newPhotos = validatedData.photos.filter(p => !p.id)

      // Delete photos that are no longer in the updated list
      const photosToDelete = existingPhotoIds.filter((id: string) => !updatedPhotoIds.includes(id))
      if (photosToDelete.length > 0) {
        await (prisma as any).walkThroughPhoto.deleteMany({
          where: {
            id: { in: photosToDelete },
            noteId: params.id
          }
        })
      }

      // Update existing photos (description, order changes)
      const existingPhotosToUpdate = validatedData.photos.filter(p => p.id && existingPhotoIds.includes(p.id))
      for (const photo of existingPhotosToUpdate) {
        await (prisma as any).walkThroughPhoto.update({
          where: { id: photo.id },
          data: {
            description: photo.description || '',
            order: photo.order ?? 0
          }
        })
      }

      // Create new photos
      if (newPhotos.length > 0) {
        updateData.photos = {
          create: newPhotos.map((photo, index) => ({
            filename: photo.filename,
            filepath: photo.filepath,
            filesize: photo.filesize,
            mimetype: photo.mimetype,
            description: photo.description || '',
            order: photo.order ?? (existingPhotos.length + index)
          }))
        }
      }
    }

    // Update note
    const updatedNote = await prisma.walkThroughNote.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        property: {
          select: {
            address: true
          }
        },
        photos: {
          orderBy: {
            order: 'asc'
          }
        }
      } as any
    })

    return NextResponse.json({
      success: true,
      note: updatedNote
    })

  } catch (error) {
    console.error('Error updating walk-through note:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data'
      }, { status: 400 })
    }
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/walkthrough-notes/[id] - Delete a walk-through note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Verify note exists and is accessible
    const isAdmin = (session.user as any).role === 'ADMIN'
    const noteWhereClause = isAdmin 
      ? { id: params.id }
      : { id: params.id, userId: user.id }

    const existingNote = await prisma.walkThroughNote.findFirst({
      where: noteWhereClause
    })

    if (!existingNote) {
      return NextResponse.json({
        success: false,
        error: 'Walk-through note not found'
      }, { status: 404 })
    }

    // Delete associated photos first (cleanup files)
    const photosToDelete = await (prisma as any).walkThroughPhoto.findMany({
      where: { noteId: params.id },
      select: { filepath: true }
    })

    // Delete photo files from filesystem
    for (const photo of photosToDelete) {
      try {
        const fullPath = path.join(process.cwd(), 'public', photo.filepath)
        await fs.unlink(fullPath)
      } catch (error) {
        console.warn('Failed to delete photo file:', photo.filepath, error)
      }
    }

    // Delete note (cascade will delete photos from DB)
    await prisma.walkThroughNote.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Walk-through note deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting walk-through note:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}