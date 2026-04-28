import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createDeck, getDecksWithCardCountByUserId } from "@/db/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateDeckButton } from "./create-deck-button";
import { createDeckInputSchema, type CreateDeckInput } from "./schemas";

const FREE_PLAN_MAX_DECKS = 3;

export default async function DashboardPage() {
  const { userId, has } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { decks, cardCount } = await getDecksWithCardCountByUserId(userId);

  const isProUser = has({ plan: "pro" });
  const hasReachedLimit = !isProUser && decks.length >= FREE_PLAN_MAX_DECKS;

  const stats = [
    { label: "Decks Active", value: decks.length.toString() },
    { label: "Cards Created", value: cardCount.toString() },
    {
      label: "Avg Cards / Deck",
      value: decks.length > 0 ? (cardCount / decks.length).toFixed(1) : "0.0",
    },
  ];

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function createDeckAction(input: CreateDeckInput): Promise<number> {
    "use server";

    const parsed = createDeckInputSchema.parse(input);
    const { userId: actionUserId, has: actionHas } = await auth();

    if (!actionUserId) {
      throw new Error("You must be signed in to create a deck.");
    }

    // Server-side guard: enforce deck limit for free users
    const actionIsProUser = actionHas({ plan: "pro" });
    if (!actionIsProUser) {
      const { decks: currentDecks } =
        await getDecksWithCardCountByUserId(actionUserId);
      if (currentDecks.length >= FREE_PLAN_MAX_DECKS) {
        throw new Error(
          `Free plan is limited to ${FREE_PLAN_MAX_DECKS} decks. Please upgrade to Pro for unlimited decks.`,
        );
      }
    }

    const deck = await createDeck(
      actionUserId,
      parsed.title,
      parsed.description,
    );

    revalidatePath("/dashboard");

    return deck.id;
  }

  return (
    <main className="flex min-h-screen w-full bg-background px-6 py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
              Dashboard
              {isProUser && (
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                  PRO
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your learning progress and jump back into study mode.
            </p>
          </div>
          <CreateDeckButton
            createDeckAction={createDeckAction}
            hasReachedLimit={hasReachedLimit}
            currentDeckCount={decks.length}
            maxDecks={FREE_PLAN_MAX_DECKS}
          />
        </header>

        {/* Deck limit banner for free users */}
        {!isProUser && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {decks.length}
              </span>{" "}
              / {FREE_PLAN_MAX_DECKS} decks used on the Free plan.
              {hasReachedLimit
                ? " You've hit your limit — upgrade to create more."
                : ` ${FREE_PLAN_MAX_DECKS - decks.length} remaining.`}
            </p>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Upgrade
            </Link>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-card-foreground">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your Decks</CardTitle>
          </CardHeader>
          <CardContent>
            {decks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No decks found for this user yet.
              </p>
            ) : (
              <ul className="flex flex-nowrap gap-3 overflow-x-auto p-1">
                {decks.map((deck) => (
                  <li key={deck.id} className="h-[180px] w-[280px] shrink-0">
                    <Link href={`/decks/${deck.id}`} className="block h-full">
                      <Card className="flex h-full flex-col transition hover:bg-accent/40">
                        <CardHeader className="gap-2 pb-2">
                          <CardTitle className="text-base">{deck.title}</CardTitle>
                          <CardDescription>
                            {deck.description ?? "No description"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto pt-0">
                          <p className="text-right text-xs text-muted-foreground">
                            {dateFormatter.format(new Date(deck.updatedAt))}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
