import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { recordApiCall } from '@/lib/adminInsights'

// Use shared Prisma client from lib/database

// Define types for Prisma query results
type PropertyWithAnalyses = {
  id: string
  address: string
  propertyType: string
  purchasePrice: number
  createdAt: Date
  analyses: {
    id: string
    roi: number
    cashFlow: number
    recommendation: string
    recommendationScore: number
    createdAt: Date
  }[]
}

// Validation schema for property analysis input
const PropertyAnalysisSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  propertyType: z.string().min(1, 'Property type is required'),
  purchasePrice: z.number().positive('Purchase price must be positive'),
  currentValue: z.number().optional(),
  squareFootage: z.number().optional(),
  lotSize: z.number().optional(),
  yearBuilt: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  condition: z.string().optional(),
  downPayment: z.number().min(0, 'Down payment must be non-negative'),
  interestRate: z.number().min(0, 'Interest rate must be non-negative'),
  loanTerm: z.number().positive('Loan term must be positive'),
  closingCosts: z.number().min(0, 'Closing costs must be non-negative').optional(),
  pmiRate: z.number().min(0, 'PMI rate must be non-negative').optional(),
  grossRent: z.number().positive('Gross rent must be positive'),
  vacancyRate: z.number().min(0, 'Vacancy rate must be non-negative').max(1, 'Vacancy rate cannot exceed 100%'),
  propertyTaxes: z.number().min(0, 'Property taxes must be non-negative').optional(),
  insurance: z.number().min(0, 'Insurance must be non-negative').optional(),
  propertyMgmt: z.number().min(0, 'Property management must be non-negative').optional(),
  maintenance: z.number().min(0, 'Maintenance must be non-negative').optional(),
  utilities: z.number().min(0, 'Utilities must be non-negative').optional(),
  hoaFees: z.number().min(0, 'HOA fees must be non-negative').optional(),
  equipment: z.number().min(0, 'Equipment must be non-negative').optional(),
  rehabCosts: z.number().min(0, 'Rehab costs must be non-negative').optional(),
  imageUrl: z.string().url().optional(),
  rentalStrategy: z.enum(['entire-house', 'individual-rooms']).optional().default('entire-house'),
})

async function buildPropertyData(validatedData: any, body: any, session: any) {
  return ({
    userId: (session.user as any).id,
    address: validatedData.address,
    propertyType: validatedData.propertyType,
    purchasePrice: validatedData.purchasePrice,
    currentValue: validatedData.currentValue || null,
    squareFootage: validatedData.squareFootage || null,
    lotSize: validatedData.lotSize || null,
    yearBuilt: validatedData.yearBuilt || null,
    bedrooms: validatedData.bedrooms || null,
    bathrooms: validatedData.bathrooms || null,
    condition: validatedData.condition || null,
    downPayment: validatedData.downPayment,
    interestRate: validatedData.interestRate,
    loanTerm: validatedData.loanTerm,
    closingCosts: validatedData.closingCosts || null,
    pmiRate: validatedData.pmiRate || null,
    grossRent: validatedData.grossRent,
    vacancyRate: validatedData.vacancyRate,
    rentalStrategy: validatedData.rentalStrategy || (body.propertyData && body.propertyData.rentalStrategy) || 'entire-house',
    propertyTaxes: validatedData.propertyTaxes || null,
    insurance: validatedData.insurance || null,
    propertyMgmt: validatedData.propertyMgmt || null,
    maintenance: validatedData.maintenance || null,
    utilities: validatedData.utilities || null,
    hoaFees: validatedData.hoaFees || null,
    equipment: validatedData.equipment || null,
    rehabCosts: validatedData.rehabCosts || null,
    imageUrl: validatedData.imageUrl || body.propertyData.imageUrl || null,
  }) as any
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  let status = 200;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      status = 401;
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status })
    }
    const body = await request.json()
    
    // Debug logging
    console.log('Received body:', JSON.stringify(body, null, 2))
    
    // Validate input data
    const validatedData = PropertyAnalysisSchema.parse(body.propertyData)
    const results = body.results
    
    // Debug logging for results
    console.log('Results data:', JSON.stringify(results, null, 2))

    // Save property to database
    const createPropertyWithRentalStrategy = async () => {
      return prisma.property.create({ data: await buildPropertyData(validatedData, body, session) })
    }

    let property: any;
    try {
      property = await createPropertyWithRentalStrategy();
    } catch (err: any) {
      // Self-heal if the rentalStrategy column is missing in production (migration not yet applied)
      if (err?.code === 'P2022' && err?.meta?.column === 'rentalStrategy') {
        console.warn('[Self-Heal] rentalStrategy column missing. Attempting on-the-fly addition and retry...');
        try {
          // SQLite safe additive ALTER TABLE (no DROP/REWRITE) – if it races, ignore failure.
          await prisma.$executeRawUnsafe("ALTER TABLE properties ADD COLUMN rentalStrategy TEXT DEFAULT 'entire-house'");
          // Backfill nulls if any existing rows (older rows will get default automatically for new queries)
          await prisma.$executeRawUnsafe("UPDATE properties SET rentalStrategy='entire-house' WHERE rentalStrategy IS NULL OR rentalStrategy=''");
          property = await createPropertyWithRentalStrategy();
          console.log('[Self-Heal] rentalStrategy column added successfully.');
        } catch (healErr) {
          console.error('[Self-Heal] Failed to add rentalStrategy column:', healErr);
          throw err; // rethrow original error path
        }
      } else {
        throw err;
      }
    }

    // Save analysis results
    const analysis = await prisma.analysis.create({
      data: {
        propertyId: property.id,
        monthlyPayment: results.monthlyPayment || 0,
        cashFlow: results.monthlyCashFlow || 0,
        annualCashFlow: results.annualCashFlow || 0,
        roi: results.roi || 0,
        capRate: results.capRate || 0,
        npv: results.npv || 0,
        irr: results.irr || null,
        totalCashInvested: results.totalCashInvested || 0,
        netOperatingIncome: results.netOperatingIncome || 0,
        effectiveGrossIncome: results.effectiveGrossIncome || 0,
        recommendation: results.recommendation || 'PASS',
        recommendationScore: results.recommendationScore || 0,
        monthlyProjections: JSON.stringify(results.monthlyProjections || []),
        annualProjections: JSON.stringify(results.annualProjections || []),
        recommendationReasons: JSON.stringify(results.recommendationReasons || []),
      },
    })

    return NextResponse.json({
      success: true,
      propertyId: property.id,
      analysisId: analysis.id,
    })

  } catch (error) {
    console.error('Error saving property analysis:', error)
    
    if (error instanceof z.ZodError) {
      status = 400;
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status }
      )
    }
    status = 500;
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status }
    )
  } finally {
    recordApiCall(request, status, Date.now() - start);
  }
}

export async function GET(request: NextRequest) {
  recordApiCall(request);
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 10
    const offset = Number(searchParams.get('offset')) || 0
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const onlyArchived = searchParams.get('archived') === 'true'

    // Build where clause for archived status
    let archivedFilter = {};
    if (onlyArchived) {
      archivedFilter = { archived: true };
    } else if (includeArchived) {
      // No filter, show both
      archivedFilter = {};
    } else {
      archivedFilter = { archived: false };
    }

    // Get recent property analyses
    const baseWhereClause = (session.user as any).role === 'ADMIN' ? {} : { userId: (session.user as any).id }
    const whereClause = { ...baseWhereClause, ...archivedFilter }
    const isAdmin = (session.user as any).role === 'ADMIN';
    const analyses = await prisma.property.findMany({
      where: whereClause,
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get the most recent analysis for each property
        },
        walkThroughNotes: {
          select: { rating: true },
        },
        ...(isAdmin && { owner: true }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Transform data for response
    const formattedAnalyses = analyses.map((property: any) => {
      const validRatings = property.walkThroughNotes
        .map((n: any) => n.rating)
        .filter((r: any): r is number => typeof r === 'number' && r > 0)
      const walkThroughAverageRating = validRatings.length
        ? validRatings.reduce((a: number, b: number) => a + b, 0) / validRatings.length
        : null
      const walkThroughRatingCount = validRatings.length
      return {
        id: property.id,
        address: property.address,
        propertyType: property.propertyType,
        purchasePrice: property.purchasePrice,
  rentalStrategy: (property as any).rentalStrategy || 'entire-house',
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        createdAt: property.createdAt,
        grossRent: property.grossRent,
        squareFootage: property.squareFootage,
        imageUrl: property.imageUrl,
        archived: property.archived,
        analysis: property.analyses[0]
          ? {
              id: property.analyses[0].id,
              roi: property.analyses[0].roi,
              monthlyCashFlow: property.analyses[0].cashFlow,
              recommendation: property.analyses[0].recommendation,
              recommendationScore: property.analyses[0].recommendationScore,
              createdAt: property.analyses[0].createdAt,
              totalCashInvested: property.analyses[0].totalCashInvested,
              npv: property.analyses[0].npv,
            }
          : null,
        walkThroughAverageRating,
        walkThroughRatingCount,
        ...(isAdmin && property.owner
          ? {
              owner: {
                name: property.owner.name,
                email: property.owner.email,
              },
            }
          : {}),
      }
    });

    return NextResponse.json({
      success: true,
      analyses: formattedAnalyses,
      total: await prisma.property.count({ where: whereClause }),
    });

  } catch (error) {
  // ...existing code...

  // When creating or updating a property, accept and save imageUrl
  // Example for POST (create):
  // const { address, propertyType, purchasePrice, ..., imageUrl } = req.body;
  // await prisma.property.create({ data: { address, propertyType, purchasePrice, ..., imageUrl } });

  // Example for PUT/PATCH (update):
  // const { id, ...fields, imageUrl } = req.body;
  // await prisma.property.update({ where: { id }, data: { ...fields, imageUrl } });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}