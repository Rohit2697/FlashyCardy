# Clerk Billing Rule

All pricing, subscription, and feature-gating logic in this project must be implemented using Clerk Billing (B2C SaaS model).

## Plans

This application has exactly two user-level subscription plans, configured in the Clerk Dashboard:

| Plan Slug    | Description                          |
| ------------ | ------------------------------------ |
| `free_user`  | Default plan for all new users       |
| `pro`        | Paid plan with premium capabilities  |

## Features

Features are entitlements attached to plans via the Clerk Dashboard. Use the feature slugs below consistently throughout the codebase:

| Feature Slug           | Attached To   | Description                                       |
| ---------------------- | ------------- | ------------------------------------------------- |
| `3_decks_limit`        | `free_user`   | Limits the user to a maximum of 3 decks           |
| `unlimited_decks`      | `pro`         | Allows the user to create unlimited decks          |
| `ai_deck_generation`   | `pro`         | Grants access to AI-powered deck generation        |

## Access Control

### Server-Side — `has()` helper

Use the `has()` helper from `auth()` to gate access on the server. Always check by **feature** rather than by plan when guarding specific functionality.

```tsx
// Check by feature (preferred for feature-gating)
import { auth } from '@clerk/nextjs/server'

const { has } = await auth()
const canUseAI = has({ feature: 'ai_deck_generation' })
const hasUnlimitedDecks = has({ feature: 'unlimited_decks' })
```

```tsx
// Check by plan (use when the entire route/page is plan-specific)
const isProUser = has({ plan: 'pro' })
```

### Client-Side — `<Show>` component

Use the `<Show>` component from `@clerk/nextjs` to conditionally render UI based on plan or feature access.

```tsx
import { Show } from '@clerk/nextjs'

<Show
  when={{ feature: 'ai_deck_generation' }}
  fallback={<UpgradePrompt />}
>
  <AIGenerateButton />
</Show>
```

## Deck Limit Enforcement

When a user with the `3_decks_limit` feature (i.e., a `free_user`) attempts to create a deck:

1. **Server-side**: Before inserting, count the user's existing decks. If the count is ≥ 3 and `has({ feature: 'unlimited_decks' })` is `false`, reject the request with a clear error message.
2. **Client-side**: Use `<Show when={{ feature: 'unlimited_decks' }}>` to show/hide the create-deck button or display an upgrade prompt when the limit is reached.

## Pricing Page

Use the `<PricingTable />` component from `@clerk/nextjs` to display plans and features. Place it on a dedicated pricing route.

```tsx
// app/pricing/page.tsx
import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
      <PricingTable />
    </div>
  )
}
```

## Requirements

- All plan and feature slugs must match the values defined in this rule exactly — do not invent new slugs without updating this document.
- Prefer feature-based checks (`has({ feature: '...' })`) over plan-based checks (`has({ plan: '...' })`) for gating specific functionality.
- Use plan-based checks only when gating entire routes or pages that are inherently tied to a plan tier.
- Always perform server-side checks before privileged operations (deck creation beyond limit, AI generation). Never rely solely on client-side gating.
- Use `<Show>` for client-side conditional rendering; do not write manual `useAuth()` + ternary logic for feature gates.

## Allowed

- `has()` from `auth()` (server-side) for feature/plan checks.
- `<Show>` component (client-side) for conditional rendering based on features/plans.
- `<PricingTable />` component for displaying pricing information.
- Clerk Dashboard for managing plans, features, and subscriptions.

## Not Allowed

- Hard-coding subscription status or plan tiers in the local database — Clerk is the single source of truth for billing state.
- Bypassing Clerk Billing by implementing custom Stripe integration for subscription management.
- Using client-side-only checks to protect paid features without a corresponding server-side guard.
- Creating or referencing plan/feature slugs that are not listed in this rule.
