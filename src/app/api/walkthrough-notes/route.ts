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
        }
      },
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

    // Create note
    const note = await prisma.walkThroughNote.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        rating: validatedData.rating,
        propertyId: validatedData.propertyId,
        userId: user.id
      },
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
        }
      }
    })

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