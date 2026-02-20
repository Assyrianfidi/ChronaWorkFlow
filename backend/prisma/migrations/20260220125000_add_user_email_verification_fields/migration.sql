DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'emailVerified'
  ) THEN
    ALTER TABLE users ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'emailVerificationToken'
  ) THEN
    ALTER TABLE users ADD COLUMN "emailVerificationToken" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'emailVerificationExpires'
  ) THEN
    ALTER TABLE users ADD COLUMN "emailVerificationExpires" TIMESTAMP(3);
  END IF;
END $$;
