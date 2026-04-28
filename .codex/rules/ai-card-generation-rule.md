# AI Card Generation Rule

AI-powered card generation uses the **Vercel AI SDK** (`ai` package) with structured output to produce flashcards from a deck's title and description. This feature is gated behind the `pro` plan's `ai_deck_generation` feature entitlement.

## Prerequisites

- The `ai` package and a model provider (e.g. `@ai-sdk/openai`) must be installed.
- Zod is used for structured output schemas (already a project dependency).

## Card Generation Schema

Use the following Zod schema when requesting structured card output from the AI SDK. This schema must be the single source of truth for the shape of AI-generated cards.

```ts
// src/lib/ai/schemas.ts
import { z } from "zod";

/**
 * Schema for a single AI-generated flashcard.
 */
export const aiGeneratedCardSchema = z.object({
  front: z
    .string()
    .min(1)
    .max(5000)
    .describe("The question or prompt shown on the front of the flashcard"),
  back: z
    .string()
    .min(1)
    .max(5000)
    .describe("The answer or explanation shown on the back of the flashcard"),
});

export type AIGeneratedCard = z.infer<typeof aiGeneratedCardSchema>;
```

## Generating Cards with the Vercel AI SDK

Use `generateText` with `Output.array()` to generate an array of flashcards. The `element` property references the `aiGeneratedCardSchema` defined above.

```ts
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGeneratedCardSchema } from "@/lib/ai/schemas";

const { output } = await generateText({
  model: openai("gpt-4o-mini"),
  output: Output.array({
    name: "Flashcards",
    description: "An array of flashcards generated from the deck topic.",
    element: aiGeneratedCardSchema,
  }),
  prompt: `Generate flashcards for the following deck.\n\nTitle: ${deck.title}\nDescription: ${deck.description}`,
});
```

For streaming, use `streamText` with `elementStream` so each completed card can be rendered as it arrives:

```ts
import { streamText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { aiGeneratedCardSchema } from "@/lib/ai/schemas";

const { elementStream } = streamText({
  model: openai("gpt-4o-mini"),
  output: Output.array({
    name: "Flashcards",
    description: "An array of flashcards generated from the deck topic.",
    element: aiGeneratedCardSchema,
  }),
  prompt: `Generate flashcards for the following deck.\n\nTitle: ${deck.title}\nDescription: ${deck.description}`,
});

for await (const card of elementStream) {
  // Each `card` is a complete, validated { front, back } object
}
```

## Access Control

### Server-Side Guard (Required)

Every AI generation endpoint or Server Action **must** verify the `ai_deck_generation` feature before executing:

```ts
import { auth } from "@clerk/nextjs/server";

const { userId, has } = await auth();
if (!userId) throw new Error("Unauthorized");

const canUseAI = has({ feature: "ai_deck_generation" });
if (!canUseAI) {
  throw new Error("AI card generation requires a Pro subscription.");
}
```

### Client-Side Gating (Required)

Use the `<Show>` component from `@clerk/nextjs` to conditionally render the "Generate with AI" button.

#### Pro user — deck has title + description

Show the AI generate button normally.

#### Pro user — deck is missing description

Show the button in a **disabled** state with a tooltip:

> "Add a description to this deck to generate cards with AI."

#### Free user

Show the button in a **disabled** state with a tooltip that links to the pricing page:

> "Upgrade to Pro to generate cards with AI."

Clicking the tooltip link should navigate to `/pricing`.

```tsx
import { Show } from "@clerk/nextjs";

{/* --- Free-user fallback --- */}
<Show
  when={{ feature: "ai_deck_generation" }}
  fallback={
    <Tooltip content={
      <span>
        Upgrade to Pro to generate cards with AI.{" "}
        <Link href="/pricing" className="underline">View plans</Link>
      </span>
    }>
      <Button disabled>
        <Sparkles className="h-4 w-4 mr-1.5" />
        Generate with AI
      </Button>
    </Tooltip>
  }
>
  {/* --- Pro user: check for description --- */}
  {deck.description ? (
    <AIGenerateButton deckId={deck.id} />
  ) : (
    <Tooltip content="Add a description to this deck to generate cards with AI.">
      <Button disabled>
        <Sparkles className="h-4 w-4 mr-1.5" />
        Generate with AI
      </Button>
    </Tooltip>
  )}
</Show>
```

## Deck Description Requirement

AI card generation **requires** the deck to have both a `title` (always required by schema) and a non-empty `description`. This must be enforced at two levels:

1. **Client-side**: Disable the generate button and show the tooltip when `deck.description` is `null` or empty.
2. **Server-side**: Validate before calling the AI model:

```ts
if (!deck.description || deck.description.trim().length === 0) {
  throw new Error(
    "A deck description is required to generate cards with AI. Please add a description first."
  );
}
```

## Where to Place AI Logic

| Concern                  | Location                                      |
| ------------------------ | --------------------------------------------- |
| Zod schema               | `src/lib/ai/schemas.ts`                       |
| Server Action / API route| `src/app/decks/[deckId]/` or `src/app/api/ai/` |
| Client UI (button, tooltip) | `src/app/decks/[deckId]/` components       |

## Requirements

- The `aiGeneratedCardSchema` must stay in sync with the `cardsTable` schema (`front: text`, `back: text`) — both use `string` with a max of 5000 characters.
- Always use `Output.array({ element: aiGeneratedCardSchema })` (not `Output.object`) so the model returns multiple cards.
- Use `.describe()` on schema properties to guide the model.
- Always perform the server-side `has({ feature: 'ai_deck_generation' })` check before calling the AI model — never rely solely on client-side gating.
- Always validate that `deck.description` is non-empty on the server before generating.

## Not Allowed

- Generating cards for a deck without a description — the model needs context.
- Allowing free-plan users to trigger AI generation (even via direct API call).
- Using `Output.object()` for card generation — cards are a list, use `Output.array()`.
- Skipping the server-side feature check in favor of client-only gating.
- Hard-coding AI access status in the local database — Clerk is the single source of truth.
