# Server Data Fetching and Validation Rule

Data retrieval and database mutations must follow strict server-side patterns.

## Requirements

- Data retrieval must happen in Server Components, not Client Components.
- All database insert, update, and delete operations must happen via Server Actions.
- All input validation must be done with Zod.
- Data passed to Server Actions must be validated using Zod.
- Server Action inputs must use explicit TypeScript types inferred from Zod schemas.
- Do not use `FormData` as the input type for Server Actions.

## Allowed

- Fetching data in Server Components before rendering UI.
- Calling Server Actions from the client only as an invocation boundary, with validation enforced in the action.
- Using `z.object(...)` schemas and `z.infer<typeof schema>` types for action inputs.

## Not Allowed

- Fetching database data directly inside Client Components.
- Running insert/update/delete logic directly from Client Components.
- Accepting unvalidated payloads in Server Actions.
- Typing Server Action input as `FormData`.

## Implementation Notes

- Define Zod schemas close to each action or in a shared validation module.
- Parse input inside Server Actions (`schema.parse(...)` or `schema.safeParse(...)`) before business logic and DB calls.
- Prefer structured typed payloads from client to action instead of raw form payload objects.
