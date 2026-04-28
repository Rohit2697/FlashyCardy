import type { Metadata } from "next";
import Link from "next/link";
import { PricingTable } from "@clerk/nextjs";
import { ArrowLeft, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing – FlashyCardy",
  description:
    "Choose the plan that fits your learning goals. Start free or unlock unlimited decks and AI-powered generation with Pro.",
};

export default function PricingPage() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-background">
      {/* Hero section */}
      <section className="relative overflow-hidden border-b border-border px-6 py-16 text-center md:py-24">
        {/* Decorative gradient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl"
        />

        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Simple pricing for{" "}
          <span className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            smarter learning
            <Sparkles className="h-6 w-6 text-primary md:h-8 md:w-8" />
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
          Start for free with up to 3 decks. Upgrade to Pro to unlock unlimited
          decks, AI-powered deck generation, and more.
        </p>
      </section>

      {/* Pricing table section */}
      <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 md:py-16">
        <PricingTable />
      </section>

      {/* FAQ / footer note */}
      <section className="border-t border-border px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Have questions?{" "}
          <a
            href="mailto:support@flashycardy.com"
            className="text-sm text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Contact us
          </a>
          . Cancel or change your plan anytime.
        </p>
      </section>
    </main>
  );
}
