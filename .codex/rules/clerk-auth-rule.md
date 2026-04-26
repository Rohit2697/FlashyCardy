# Clerk Auth and Data Ownership Rule

All authentication and authorization in this project must be handled by Clerk.

## Core Principle

Every data access must be scoped to the currently authenticated Clerk user. A user must never read, update, or delete data that does not belong to them.

## Requirements

- Use Clerk as the only auth provider for user identity in app code.
- Resolve the current user from Clerk on every protected request/action.
- For protected pages/routes that require login, redirect unauthenticated users to the homepage (`/`) instead of showing protected content.
- For protected APIs/actions, deny access when no authenticated Clerk user is present.
- Treat `decks.userId` as the ownership field and always filter by it for deck-level operations.
- For card operations, enforce ownership through the parent deck (`cards.deckId -> decks.id -> decks.userId`).
- On create operations, persist ownership using the authenticated Clerk user id.

## Query Enforcement

- Reads: always include user ownership constraints.
- Updates: only update rows that match the authenticated user ownership constraints.
- Deletes: only delete rows that match the authenticated user ownership constraints.
- Never trust user ids coming from client input when deciding ownership.

## Allowed

- Clerk helpers/middleware/server APIs for auth checks.
- Drizzle queries that include explicit ownership filters.
- Server-side authorization checks before DB operations.

## Not Allowed

- Mixing multiple auth providers for app identity.
- Returning or mutating records without ownership validation.
- Access checks based only on resource id without user ownership scope.
- Client-side-only authorization for protected data operations.

## Implementation Notes

- Prefer a shared server utility that returns the authenticated Clerk user id and throws on unauthenticated requests.
- In page-level guards and middleware for protected UI routes, use a homepage redirect (`redirect("/")`) for unauthenticated users.
- Keep ownership checks close to query construction so accidental unscoped queries are avoided.
- Add tests for cross-user access attempts to ensure forbidden access is blocked.
