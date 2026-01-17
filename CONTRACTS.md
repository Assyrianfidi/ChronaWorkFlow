# Contracts (Compile-Time Stability)

## What is a contract?

A contract is a TypeScript type that defines a stable boundary between layers (client <-> server).
Contracts include:

- request/response DTOs
- enums used across layers
- common API envelope shapes

## Where contracts live

- Authoritative public contracts live in `shared/`.
  - `shared/contracts.ts` defines cross-layer API envelope shapes.

## Rules

- client (`client/src`) may depend on `shared/` contracts but must not import server internals.
- server (`server/`) may depend on `shared/` contracts for public request/response typing.
- shared (`shared/`) must not import from client or server.

## Enforcement

- ESLint enforces explicit module boundary types for:
  - `server/controllers/**` (public handler implementations)
  - `client/src/services/api-client.ts` and `client/src/lib/api/**` (client API wrapper layer)

This prevents silent contract drift by requiring explicit function signatures at key public surfaces.
