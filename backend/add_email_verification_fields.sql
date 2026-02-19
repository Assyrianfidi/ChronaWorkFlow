-- Add missing email verification fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP;
