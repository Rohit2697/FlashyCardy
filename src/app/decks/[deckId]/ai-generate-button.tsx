"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type AIGenerateButtonProps = {
  deckId: number;
  generateCardsWithAIAction: (input: { deckId: number }) => Promise<{ count: number }>;
};

export function AIGenerateButton({
  deckId,
  generateCardsWithAIAction,
}: AIGenerateButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const loadingToastId = toast.loading("Generating cards with AI… This may take a moment.");
      try {
        const result = await generateCardsWithAIAction({ deckId });
        toast.success(`${result.count} cards generated successfully!`, {
          id: loadingToastId,
        });
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Failed to generate cards. Please try again.";
        toast.error(message, { id: loadingToastId });
      }
    });
  }

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={handleGenerate}
      className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-violet-500/25"
    >
      {pending ? (
        <>
          <svg
            className="mr-1.5 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Generating…
        </>
      ) : (
        <>
          <svg
            className="mr-1.5 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
          </svg>
          Generate Cards with AI
        </>
      )}
    </Button>
  );
}
