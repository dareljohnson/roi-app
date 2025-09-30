import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
  sessionArg?: any // allow test injection
) {
  try {
    // Check authentication
    let session;
    if (sessionArg === null) {
      // Explicitly unauthenticated (for test)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    } else if (typeof sessionArg === 'undefined') {
      session = await getServerSession(authOptions);
    } else {
      session = sessionArg;
    }
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = params.id;
    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Invalid property ID' }, { status: 400 });
    }

    // Parse request body to get archived status
    const body = await request.json();
    const { archived } = body;

    if (typeof archived !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'archived field must be a boolean' },
        { status: 400 }
      );
    }


    // Check if property exists
    const property = await prisma.property.findFirst({ where: { id: propertyId } });
    if (!property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    const isAdmin = (session.user as any).role === 'ADMIN';
    const isOwner = property.userId === (session.user as any).id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }


    // Update the property's archived status with granular error logging
    let updatedProperty;
    try {
      updatedProperty = await prisma.property.update({
        where: {
          id: propertyId,
        },
        data: {
          archived: archived,
        },
      });
    } catch (updateError) {
      console.error('Prisma update error in PATCH /api/properties/[id]/archive:', {
        updateError,
        propertyId,
        archived,
        session,
      });
      return NextResponse.json(
        { success: false, error: 'Database update error', details: String(updateError) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: archived ? 'Property archived successfully' : 'Property unarchived successfully',
      property: {
        id: updatedProperty.id,
        address: updatedProperty.address,
        archived: updatedProperty.archived,
      },
    });

  } catch (error) {
    // Try to log propertyId and session if available
    let propertyIdLog = undefined;
    try {
      propertyIdLog = (typeof params !== 'undefined' && params && params.id) ? params.id : undefined;
    } catch {}
    console.error('Error updating property archive status:', {
      error,
      propertyId: propertyIdLog,
      session: sessionArg,
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}