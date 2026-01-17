# Architecture

## Layers

- client
  - Location: `client/src`
  - Responsibility: UI / frontend code

- server
  - Location: `server/`
  - Responsibility: API surface, business logic, services

- shared
  - Location: `shared/`
  - Responsibility: Shared types/DTOs/utils that must remain independent of UI and server runtime

- infrastructure
  - Location: `server/lib/`, `server/services/`, `prisma/`, `drizzle*`, `scripts/`
  - Responsibility: Database, cache, external services, and operational glue

## Allowed dependencies

- client -> shared
- server -> shared
- server -> infrastructure
- infrastructure -> shared

## Forbidden dependencies

- client -> server or infrastructure
- shared -> client or server
- server -> client

## Why this exists

These boundaries prevent accidental coupling between layers, keep shared modules portable, and make refactors safer by ensuring import relationships reflect the intended architecture.
