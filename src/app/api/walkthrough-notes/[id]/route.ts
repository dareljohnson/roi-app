import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { WalkThroughNoteSchema, WalkThroughNoteUpdateSchema } from '@/types/walkthrough'

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
        }
      }
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

    // Update note
    const updatedNote = await prisma.walkThroughNote.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        content: validatedData.content,
        rating: validatedData.rating
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

    // Delete note
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