-- Add rentalStrategy column to properties table
ALTER TABLE "properties" ADD COLUMN "rentalStrategy" TEXT NOT NULL DEFAULT 'entire-house';
