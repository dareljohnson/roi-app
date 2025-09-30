const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seed() {
  // Create admin user
  const adminEmail = 'admin@example.com'
  const adminPassword = 'AdminPass123!'
  const adminHashedPassword = await bcrypt.hash(adminPassword, 10)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
      role: 'ADMIN',
      hashedPassword: adminHashedPassword,
    },
  })
  console.log(`✅ Created admin user: ${adminEmail} (password: ${adminPassword})`)
  console.log('🌱 Seeding database...')

  // Create another admin user
  const anotherAdminEmail = 'dareljohnson@gmail.com'
  const anotherAdminPassword = 'Bunny200#'
  const anotherAdminHashedPassword = await bcrypt.hash(anotherAdminPassword, 10)
  const anotherAdmin = await prisma.user.upsert({
    where: { email: anotherAdminEmail },
    update: {},
    create: {
      email: anotherAdminEmail,
      name: 'Admin One',
      role: 'ADMIN',
      hashedPassword: anotherAdminHashedPassword,
    },
  })
  console.log(`✅ Created admin user: ${anotherAdminEmail} (password: ${anotherAdminPassword})`)

  // Create sample property for testing
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
  console.log('🌱 Database seeding completed!')
}

seed()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })