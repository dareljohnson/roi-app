export async function PATCH(request: NextRequest, { params }: { params: { id: string } }, sessionArg?: any) {
  const start = Date.now();
  let status = 200;
  try {
    let session
    if (sessionArg === null) {
      status = 401;
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status })
    } else if (typeof sessionArg === 'undefined') {
      session = await getServerSession(authOptions)
    } else {
      session = sessionArg
    }
    if (!session?.user) {
      status = 401;
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status })
    }
    const propertyId = params.id;
    if (!propertyId) {
      status = 400;
      return NextResponse.json({ success: false, error: 'Invalid property ID' }, { status })
    }
    const body = await request.json();
    const { imageUrl } = body;
    if (!imageUrl) {
      status = 400;
      return NextResponse.json({ success: false, error: 'Missing imageUrl' }, { status })
    }
    // Verify ownership unless admin
    const prop = await prisma.property.findUnique({ where: { id: propertyId }, select: { userId: true } })
    if (!prop) {
      status = 404;
      return NextResponse.json({ success: false, error: 'Property not found' }, { status })
    }
    if ((session.user as any).role !== 'ADMIN' && prop.userId !== (session.user as any).id) {
      status = 403;
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status })
    }
    // Update property imageUrl
    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: { imageUrl },
    });
    return NextResponse.json({ success: true, property: updated }, { status });
  } catch (error) {
    status = 500;
    console.error('Error updating property image:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status });
  } finally {
    recordApiCall(request, status, Date.now() - start);
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { recordApiCall } from '@/lib/adminInsights'
import { prisma } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const start = Date.now();
  let status = 200;
  recordApiCall(request);
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      status = 401;
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status })
    }
    const propertyId = params.id
    if (!propertyId) {
      status = 400;
      return NextResponse.json(
        { success: false, error: 'Invalid property ID' },
        { status }
      )
    }
    // Get property with all analyses
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
        },
        walkThroughNotes: {
          select: { rating: true },
        },
      },
    })
    if (!property) {
      status = 404;
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status }
      )
    }
    // Enforce ownership unless admin
    if ((session.user as any).role !== 'ADMIN' && property.userId !== (session.user as any).id) {
      status = 403;
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status })
    }
    // Transform the most recent analysis data
    const latestAnalysis = property.analyses[0]
    if (!latestAnalysis) {
      status = 404;
      return NextResponse.json(
        { success: false, error: 'No analysis data available for this property' },
        { status }
      )
    }
    // Calculate missing fields that aren't stored in the database
    const effectiveGrossIncome = property.grossRent * (1 - property.vacancyRate) * 12
    const totalAnnualExpenses = (property.propertyTaxes || 0) + (property.insurance || 0) + 
      (property.propertyMgmt || 0) * 12 + (property.maintenance || 0) * 12 + 
      (property.utilities || 0) * 12 + (property.hoaFees || 0) * 12 + (property.equipment || 0) * 12
    const netOperatingIncome = effectiveGrossIncome - totalAnnualExpenses
    const annualDebtService = latestAnalysis.monthlyPayment * 12
    const debtServiceCoverageRatio = annualDebtService > 0 ? netOperatingIncome / annualDebtService : 1.0
    // Aggregate walk-through note ratings (ignore 0 or null)
    const validRatings = property.walkThroughNotes
      .map(n => n.rating)
      .filter((r): r is number => typeof r === 'number' && r > 0)
    const walkThroughAverageRating = validRatings.length
      ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length
      : null
    const walkThroughRatingCount = validRatings.length
    const analysisData = {
      id: property.id,
      address: property.address,
      propertyType: property.propertyType,
      purchasePrice: property.purchasePrice,
      currentValue: property.currentValue,
      squareFootage: property.squareFootage,
      lotSize: property.lotSize,
      yearBuilt: property.yearBuilt,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      condition: property.condition,
      imageUrl: property.imageUrl,
      rentalStrategy: (property as any).rentalStrategy || 'entire-house',
      downPayment: property.downPayment,
      interestRate: property.interestRate,
      loanTerm: property.loanTerm,
      closingCosts: property.closingCosts,
      pmiRate: property.pmiRate,
      grossRent: property.grossRent,
      vacancyRate: property.vacancyRate,
      propertyTaxes: property.propertyTaxes,
      insurance: property.insurance,
      propertyMgmt: property.propertyMgmt,
      maintenance: property.maintenance,
      utilities: property.utilities,
      hoaFees: property.hoaFees,
      equipment: property.equipment,
      rehabCosts: property.rehabCosts,
      roi: latestAnalysis.roi,
      monthlyPayment: latestAnalysis.monthlyPayment,
      monthlyCashFlow: latestAnalysis.cashFlow,
      capRate: latestAnalysis.capRate,
      debtServiceCoverageRatio: debtServiceCoverageRatio,
      npv: latestAnalysis.npv,
      irr: latestAnalysis.irr,
      recommendation: latestAnalysis.recommendation,
      recommendationScore: latestAnalysis.recommendationScore,
      createdAt: latestAnalysis.createdAt,
      monthlyProjections: latestAnalysis.monthlyProjections ? JSON.parse(latestAnalysis.monthlyProjections) : [],
      annualProjections: latestAnalysis.annualProjections ? JSON.parse(latestAnalysis.annualProjections) : [],
      recommendationReasons: latestAnalysis.recommendationReasons ? JSON.parse(latestAnalysis.recommendationReasons) : [],
      walkThroughAverageRating,
      walkThroughRatingCount,
    }
    return NextResponse.json({
      success: true,
      analysis: analysisData,
    })
  } catch (error) {
    status = 500;
    console.error('Error fetching property details:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status }
    )
  } finally {
    recordApiCall(request, status, Date.now() - start);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const start = Date.now();
  let status = 200;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      status = 401;
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status })
    }
    const propertyId = params.id
    if (!propertyId) {
      status = 400;
      return NextResponse.json(
        { success: false, error: 'Invalid property ID' },
        { status }
      )
    }
    // Verify ownership unless admin
    const prop = await prisma.property.findUnique({ where: { id: propertyId }, select: { userId: true } })
    if (!prop) {
      status = 404;
      return NextResponse.json({ success: false, error: 'Property not found' }, { status })
    }
    if ((session.user as any).role !== 'ADMIN' && prop.userId !== (session.user as any).id) {
      status = 403;
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status })
    }
    // Delete all analyses first (due to foreign key constraint)
    await prisma.analysis.deleteMany({
      where: { propertyId: propertyId },
    })
    // Delete the property
    const deletedProperty = await prisma.property.delete({
      where: { id: propertyId },
    })
    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully',
      deletedProperty: {
        id: deletedProperty.id,
        address: deletedProperty.address,
      },
    })
  } catch (error) {
    status = 500;
    console.error('Error deleting property:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      status = 404;
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status }
    )
  } finally {
    recordApiCall(request, status, Date.now() - start);
  }
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  let status = 201;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      status = 401;
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status })
    }
    const body = await request.json()
    // Validate and parse input data
    const {
      address,
      propertyType,
      purchasePrice,
      currentValue,
      squareFootage,
      lotSize,
      yearBuilt,
      bedrooms,
      bathrooms,
      condition,
      downPayment,
      interestRate,
      loanTerm,
      closingCosts,
      pmiRate,
      grossRent,
      vacancyRate,
      propertyTaxes,
      insurance,
      propertyMgmt,
      maintenance,
      utilities,
      hoaFees,
      equipment,
      rehabCosts,
      rentalStrategy,
    } = body
    if (!address || !propertyType || !purchasePrice || !currentValue || !squareFootage || !lotSize || !yearBuilt || !bedrooms || !bathrooms || !condition) {
      status = 400;
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status }
      )
    }
    // Create the property
    const newProperty = await prisma.property.create({
      data: {
        address,
        propertyType,
        purchasePrice,
        currentValue,
        squareFootage,
        lotSize,
        yearBuilt,
        bedrooms,
        bathrooms,
        condition,
        downPayment,
        interestRate,
        loanTerm,
        closingCosts,
        pmiRate,
        grossRent,
        vacancyRate,
        propertyTaxes,
        insurance,
        propertyMgmt,
        maintenance,
        utilities,
        hoaFees,
        equipment,
        rehabCosts,
  // @ts-ignore Prisma client needs regeneration after schema change
  rentalStrategy: rentalStrategy || 'entire-house',
        userId: (session.user as any).id, // Set the owner to the logged-in user
      },
    })
    return NextResponse.json({
      success: true,
      property: newProperty,
    }, { status })
  } catch (error) {
    status = 500;
    console.error('Error creating property:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status }
    )
  } finally {
    recordApiCall(request, status, Date.now() - start);
  }
}