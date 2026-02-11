CREATE TABLE IF NOT EXISTS "tenant_companies" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"company_id" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "tenant_companies" ADD CONSTRAINT "tenant_companies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "unique_tenant_company" ON "tenant_companies" ("tenant_id","company_id");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_company_tenant" ON "tenant_companies" ("company_id");

CREATE TABLE IF NOT EXISTS "user_tenants" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"tenant_id" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;


CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_tenant" ON "user_tenants" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_tenant_user" ON "user_tenants" ("tenant_id","user_id");

WITH seed AS (SELECT gen_random_uuid()::text AS tenant_id)
INSERT INTO "tenant_companies" ("tenant_id", "company_id")
SELECT seed.tenant_id, c."id"
FROM "companies" c
CROSS JOIN seed
WHERE NOT EXISTS (
  SELECT 1
  FROM "tenant_companies" tc
  WHERE tc."company_id" = c."id"
);

WITH seed AS (SELECT (SELECT "tenant_id" FROM "tenant_companies" ORDER BY "created_at" ASC LIMIT 1) AS tenant_id)
INSERT INTO "user_tenants" ("user_id", "tenant_id")
SELECT u."id", seed.tenant_id
FROM "users" u
CROSS JOIN seed
WHERE seed.tenant_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1
  FROM "user_tenants" ut
  WHERE ut."user_id" = u."id"
);

DO $$
DECLARE
  prisma_seed text;
BEGIN
  IF to_regclass('public.tenants') IS NOT NULL THEN
    EXECUTE 'SELECT id::text FROM public.tenants ORDER BY created_at ASC NULLS LAST LIMIT 1' INTO prisma_seed;
  END IF;

  IF prisma_seed IS NOT NULL THEN
    UPDATE "tenant_companies" SET "tenant_id" = prisma_seed;
    UPDATE "user_tenants" SET "tenant_id" = prisma_seed;
  END IF;
END $$;
