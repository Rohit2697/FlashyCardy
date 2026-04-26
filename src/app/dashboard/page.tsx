import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDecksWithCardCountByUserId } from "@/db/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { decks, cardCount } = await getDecksWithCardCountByUserId(userId);

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

  return (
    <main className="flex min-h-screen w-full bg-background px-6 py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your learning progress and jump back into study mode.
            </p>
          </div>
          <Button>Create New Deck</Button>
        </header>

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
