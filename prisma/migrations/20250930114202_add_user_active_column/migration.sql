-- CreateTable
CREATE TABLE "DocumentationEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "authorId" TEXT,
    CONSTRAINT "DocumentationEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "walk_through_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER DEFAULT 0,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "walk_through_notes_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "walk_through_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_properties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "address" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "currentValue" REAL,
    "squareFootage" INTEGER,
    "lotSize" REAL,
    "yearBuilt" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" REAL,
    "condition" TEXT,
    "downPayment" REAL NOT NULL,
    "interestRate" REAL NOT NULL,
    "loanTerm" INTEGER NOT NULL,
    "closingCosts" REAL DEFAULT 0,
    "pmiRate" REAL DEFAULT 0,
    "grossRent" REAL NOT NULL,
    "vacancyRate" REAL NOT NULL DEFAULT 0.05,
    "propertyTaxes" REAL DEFAULT 0,
    "insurance" REAL DEFAULT 0,
    "propertyMgmt" REAL DEFAULT 0,
    "maintenance" REAL DEFAULT 0,
    "utilities" REAL DEFAULT 0,
    "hoaFees" REAL DEFAULT 0,
    "equipment" REAL DEFAULT 0,
    "rehabCosts" REAL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "userId" TEXT,
    CONSTRAINT "properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_properties" ("address", "bathrooms", "bedrooms", "closingCosts", "condition", "createdAt", "currentValue", "downPayment", "equipment", "grossRent", "hoaFees", "id", "imageUrl", "insurance", "interestRate", "loanTerm", "lotSize", "maintenance", "pmiRate", "propertyMgmt", "propertyTaxes", "propertyType", "purchasePrice", "rehabCosts", "squareFootage", "updatedAt", "userId", "utilities", "vacancyRate", "yearBuilt") SELECT "address", "bathrooms", "bedrooms", "closingCosts", "condition", "createdAt", "currentValue", "downPayment", "equipment", "grossRent", "hoaFees", "id", "imageUrl", "insurance", "interestRate", "loanTerm", "lotSize", "maintenance", "pmiRate", "propertyMgmt", "propertyTaxes", "propertyType", "purchasePrice", "rehabCosts", "squareFootage", "updatedAt", "userId", "utilities", "vacancyRate", "yearBuilt" FROM "properties";
DROP TABLE "properties";
ALTER TABLE "new_properties" RENAME TO "properties";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "hashedPassword" TEXT NOT NULL,
    "lastLogin" DATETIME,
    "lastIp" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_users" ("email", "emailVerified", "hashedPassword", "id", "image", "name", "role") SELECT "email", "emailVerified", "hashedPassword", "id", "image", "name", "role" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
