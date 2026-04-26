# shadcn/ui Rule

All UI in this project must use official shadcn/ui components.

## Required Commands

Use these commands when working with shadcn/ui:

```bash
npx shadcn@latest init
npx shadcn@latest add [component]
```

Example:

```bash
npx shadcn@latest add card
```

## Mandatory UI Rules

- Always use shadcn/ui components from `@/components/ui/*` for UI building blocks.
- Do not create custom replacement components for UI primitives that exist in shadcn/ui (for example button, input, card, dialog, dropdown, table, form controls).
- If a needed primitive is missing, add it with the shadcn CLI instead of hand-rolling a custom UI primitive.
- Keep styling aligned with shadcn patterns and variants; extend via shadcn-friendly composition, not one-off custom primitives.

## Clerk Auth Button Rule

- Clerk sign-in and sign-up actions must always use the shadcn `Button` component.
- Never render plain HTML `<button>` or a custom button component for Clerk sign-in/sign-up actions.
- Preferred pattern: wrap Clerk `SignInButton` / `SignUpButton` around a shadcn `Button` (using `asChild` where applicable) so UI stays consistent.

## Notes

- This file is the source of truth for shadcn usage in this repo.
- Any future shadcn-specific conventions must be added here.
