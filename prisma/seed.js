const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seed() {
  // Create admin user (guard against empty credentials)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || ''
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || ''
  let admin = null
  if (adminEmail && adminPassword) {
    const adminHashedPassword = await bcrypt.hash(adminPassword, 10)
    admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: 'Admin User',
        role: 'ADMIN',
        hashedPassword: adminHashedPassword,
      },
    })
    console.log(`✅ Created/ensured admin user: ${adminEmail}`)
  } else {
    console.log('⚠️  Skipping primary admin creation (SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set).')
  }
  console.log('🌱 Seeding database...')

  // Optional secondary admin
  const anotherAdminEmail = process.env.SEED_ADMIN2_EMAIL || ''
  const anotherAdminPassword = process.env.SEED_ADMIN2_PASSWORD || ''
  if (anotherAdminEmail && anotherAdminPassword) {
    const anotherAdminHashedPassword = await bcrypt.hash(anotherAdminPassword, 10)
    await prisma.user.upsert({
      where: { email: anotherAdminEmail },
      update: {},
      create: {
        email: anotherAdminEmail,
        name: 'Admin One',
        role: 'ADMIN',
        hashedPassword: anotherAdminHashedPassword,
      },
    })
    console.log(`✅ Created/ensured secondary admin user: ${anotherAdminEmail}`)
  } else {
    console.log('ℹ️  No secondary admin credentials provided; skipping.')
  }

  // Create sample property for testing
  if (admin) {
    const sampleProperty = await prisma.property.create({
      data: {
        owner: { connect: { id: admin.id } },
      address: '123 Sample Street, Investment City, IC 12345',
      propertyType: 'Single Family',
      purchasePrice: 150000,
      currentValue: 155000,
      squareFootage: 1200,
      lotSize: 0.25,
      yearBuilt: 2005,
      bedrooms: 3,
      bathrooms: 2,
      condition: 'Good',
      
      // Financing
      downPayment: 30000, // 20%
      interestRate: 7.5,
      loanTerm: 30,
      closingCosts: 3000,
      pmiRate: 0.5,
      
      // Rental Income
      grossRent: 1500,
      vacancyRate: 0.05,
      
      // Operating Expenses
      propertyTaxes: 1800,
      insurance: 800,
      propertyMgmt: 150, // 10% of rent
      maintenance: 100,
      utilities: 0, // tenant pays
      hoaFees: 0,
      equipment: 50,
        rehabCosts: 5000,
      }
    })
    console.log(`✅ Created sample property: ${sampleProperty.address}`)
  } else {
    console.log('ℹ️  Skipping sample property creation (no admin user available).')
  }
  console.log('🌱 Database seeding completed!')
}

seed()
  .then(() => {
    console.log('🎉 Database seeding completed successfully!')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Database seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })