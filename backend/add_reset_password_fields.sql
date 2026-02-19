-- Add missing reset password fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT,
ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP;
