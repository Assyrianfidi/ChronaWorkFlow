# Runtime Contracts

## Why runtime validation exists

TypeScript provides compile-time safety, but external data crossing the client/server boundary is still `unknown` at runtime.
Runtime contract validation ensures we fail fast when payloads do not match the shared contracts.

## Authoritative contract surface

All cross-layer contracts must live in `shared/`.
Schemas and types must stay in lockstep by deriving TypeScript types from runtime schemas.

## Where validation is enforced

- Server: `server/controllers/**`
  - Response payloads are validated immediately before calling `res.json(...)`.
  - On contract failure, a controlled internal error is raised.

- Client: `client/src/services/api-client.ts` and `client/src/lib/api/**`
  - Parsed JSON is validated before it is returned to the rest of the client.
  - On contract failure, a typed client error is thrown.

## How to add a new validated contract

1. Define a Zod schema in `shared/contracts.ts`.
2. Export the inferred TypeScript type from that schema.
3. Server: validate the payload right before sending it.
4. Client: validate the parsed JSON right after parsing.

Do not add ad-hoc schemas outside `shared/`.
