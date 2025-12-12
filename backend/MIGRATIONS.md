# Database Migrations

This document explains how to work with database migrations in the AccuBooks backend.

## Migration Commands

### Create a New Migration

To create a new migration file, run:

```bash
npm run migrate:create migration_name
```

Replace `migration_name` with a descriptive name for your migration (e.g., `add_users_table`).

### Run Migrations

To run all pending migrations:

```bash
npm run migrate:up
# or
npm run db:migrate
```

### Rollback Migrations

To rollback the most recent migration:

```bash
npm run migrate:down
```

### Check Migration Status

To see which migrations have been applied:

```bash
npm run migrate:status
```

## Writing Migrations

Migrations are written in TypeScript and should export two functions:

- `up()`: Contains the migration logic
- `down()`: Contains the rollback logic

Example migration:

```typescript
import { sql } from "drizzle-orm";
import { db } from "../index";

export async function up() {
  await db.execute(sql`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

export async function down() {
  await db.execute(sql`DROP TABLE IF EXISTS users;`);
}
```

## Best Practices

1. **One Change Per Migration**: Each migration should make a single, atomic change to the database schema.
2. **Idempotency**: Migrations should be idempotent (running them multiple times has the same effect as running them once).
3. **Backward Compatibility**: Ensure that your application can run with both the old and new schema during deployment.
4. **Test Migrations**: Always test your migrations in a development environment before running them in production.
5. **Use Transactions**: Wrap your migration in a transaction to ensure data integrity.

## Running Migrations in Production

In production, migrations should be run as part of your deployment process. Make sure to:

1. Take a backup of your database before running migrations
2. Run migrations in a transaction if possible
3. Test migrations in a staging environment first
4. Have a rollback plan in case of failures

## Troubleshooting

### Migration Fails

If a migration fails:

1. Check the error message for details
2. Fix the issue in the migration file
3. Rollback the failed migration if needed
4. Run the migration again

### Database Lock Issues

If you encounter database lock issues, make sure:

1. No other processes are holding locks on the tables
2. Your database user has the necessary permissions
3. The database is not in a read-only state

## Schema Management

For schema management and migrations, we use Drizzle ORM with a custom migration runner. The migrations are stored in `src/db/migrations` and are executed in alphabetical order.

To generate a new migration based on schema changes:

1. Update your schema in `src/db/schema.ts`
2. Run `npm run db:generate` to generate SQL
3. Create a new migration with `npm run migrate:create migration_name`
4. Copy the generated SQL into the migration file
5. Test the migration locally before committing

## Rollback Strategy

In case you need to rollback a migration:

1. Run `npm run migrate:down` to rollback the most recent migration
2. For rolling back multiple migrations, run the command multiple times
3. For more complex rollbacks, you may need to write a custom migration

## Migration Dependencies

If your migration depends on data from other tables or external services, make sure to:

1. Handle potential data inconsistencies
2. Consider using transactions for data consistency
3. Add appropriate error handling and logging
4. Document any external dependencies in the migration file
