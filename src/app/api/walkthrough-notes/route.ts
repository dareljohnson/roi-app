import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { WalkThroughNoteSchema } from '@/types/walkthrough'

// GET /api/walkthrough-notes - Get all walk-through notes for user's properties
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    // Build query filter - admins can see all notes, users only see their own
    const isAdmin = (session.user as any).role === 'ADMIN'
    const whereClause: any = {}

    // If not admin, filter by user email
    if (!isAdmin) {
      whereClause.user = {
        email: session.user.email
      }
    }

    if (propertyId) {
      whereClause.propertyId = propertyId
    }

    const notes = await prisma.walkThroughNote.findMany({
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
      } as any,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      notes,
      total: notes.length
    })

  } catch (error) {
    console.error('Error fetching walk-through notes:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/walkthrough-notes - Create a new walk-through note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = WalkThroughNoteSchema.parse(body)

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Verify property exists and is accessible
    const isAdmin = (session.user as any).role === 'ADMIN'
    const propertyWhereClause = isAdmin 
      ? { id: validatedData.propertyId }
      : { id: validatedData.propertyId, userId: user.id }

    const property = await prisma.property.findFirst({
      where: propertyWhereClause
    })

    if (!property) {
      return NextResponse.json({ 
        success: false, 
        error: isAdmin ? 'Property not found' : 'Property not found or not owned by user'
      }, { status: 404 })
    }

    // Helper to build nested photo create data (only if photos provided)
    const buildPhotoCreate = () => (
      validatedData.photos && validatedData.photos.length > 0 ? {
        photos: {
          create: validatedData.photos.map((photo: any, index: number) => ({
            filename: photo.filename,
            filepath: photo.filepath,
            filesize: photo.filesize,
            mimetype: photo.mimetype,
            description: photo.description || '',
            order: photo.order ?? index
          }))
        }
      } : {}
    )

    const createNote = () => prisma.walkThroughNote.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        rating: validatedData.rating,
        propertyId: validatedData.propertyId,
        userId: user.id,
        ...buildPhotoCreate(),
      },
      include: {
        user: { select: { name: true, email: true } },
        property: { select: { address: true } },
        photos: { orderBy: { order: 'asc' } }
      } as any,
    })

    let note: any
    try {
      note = await createNote()
    } catch (err: any) {
      // Self-heal: missing walk_through_photos table (migration drift) => create table then retry
      if (err?.code === 'P2021' && (err?.meta?.table?.includes('walk_through_photos') || err?.meta?.table?.includes('main.walk_through_photos'))) {
        console.warn('[Self-Heal] walk_through_photos table missing. Attempting CREATE TABLE and retry...')
        try {
          await (prisma as any).$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "walk_through_photos" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "filename" TEXT NOT NULL,
            "filepath" TEXT NOT NULL,
            "filesize" INTEGER NOT NULL,
            "mimetype" TEXT NOT NULL,
            "description" TEXT,
            "order" INTEGER NOT NULL DEFAULT 0,
            "noteId" TEXT NOT NULL,
            CONSTRAINT "walk_through_photos_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "walk_through_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
          );`)
          note = await createNote()
          console.log('[Self-Heal] walk_through_photos table created successfully.')
        } catch (healErr) {
          console.error('[Self-Heal] Failed to create walk_through_photos table:', healErr)
          throw err // rethrow original
        }
      } else {
        throw err
      }
    }

    return NextResponse.json({
      success: true,
      note
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating walk-through note:', error)
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