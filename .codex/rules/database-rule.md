# Database Access Rule

All database interactions in this project must be done through Drizzle only.

## Requirements

- Use Drizzle ORM and Drizzle schema definitions for all reads, writes, updates, deletes, and migrations.
- Do not use raw SQL clients, direct database drivers, or other ORMs for application-level database access.
- Any new database logic must be implemented in the existing Drizzle-based data layer.

## Allowed

- Drizzle queries via the configured project database client.
- Drizzle migrations and schema updates.

## Not Allowed

- `pg`/`mysql2`/`sqlite` direct query usage in feature code.
- Prisma, Sequelize, TypeORM, or any non-Drizzle ORM in this codebase.
- Ad-hoc SQL access paths outside Drizzle unless explicitly approved for a one-off migration script.
