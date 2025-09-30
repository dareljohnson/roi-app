-- CreateTable
CREATE TABLE "api_call_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "error" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "properties" (
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
    "userId" TEXT,
    CONSTRAINT "properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,
    "monthlyPayment" REAL NOT NULL,
    "cashFlow" REAL NOT NULL,
    "annualCashFlow" REAL NOT NULL,
    "roi" REAL NOT NULL,
    "capRate" REAL NOT NULL,
    "npv" REAL NOT NULL,
    "irr" REAL,
    "totalCashInvested" REAL NOT NULL,
    "netOperatingIncome" REAL NOT NULL,
    "effectiveGrossIncome" REAL NOT NULL,
    "recommendation" TEXT NOT NULL,
    "recommendationScore" REAL NOT NULL,
    "recommendationReasons" TEXT,
    "monthlyProjections" TEXT,
    "annualProjections" TEXT,
    CONSTRAINT "analyses_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "hashedPassword" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
