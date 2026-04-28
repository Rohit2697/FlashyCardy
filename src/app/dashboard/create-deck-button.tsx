"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateDeckInput } from "./schemas";

type CreateDeckButtonProps = {
  createDeckAction: (input: CreateDeckInput) => Promise<number>;
  hasReachedLimit: boolean;
  currentDeckCount: number;
  maxDecks: number;
};

export function CreateDeckButton({
  createDeckAction,
  hasReachedLimit,
  currentDeckCount,
  maxDecks,
}: CreateDeckButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return "Unable to create deck right now. Please try again.";
  }

  function handleCreateClick() {
    if (hasReachedLimit) {
      setIsUpgradeDialogOpen(true);
      return;
    }
    setTitle("");
    setDescription("");
    setIsDialogOpen(true);
  }

  async function handleCreate() {
    const nextTitle = title.trim();
    const nextDescription = description.trim();

    if (!nextTitle) {
      toast.error("Deck title is required.");
      return;
    }

    const loadingToastId = toast.loading("Creating deck...");
    try {
      const newDeckId = await createDeckAction({
        title: nextTitle,
        description: nextDescription ? nextDescription : null,
      });
      setIsDialogOpen(false);
      toast.success("Deck created successfully!", { id: loadingToastId });
      router.push(`/decks/${newDeckId}`);
    } catch (error) {
      toast.error(getErrorMessage(error), { id: loadingToastId });
    }
  }

  return (
    <>
      <Button type="button" onClick={handleCreateClick}>
        Create New Deck
      </Button>

      {/* Create Deck Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Deck</DialogTitle>
            <DialogDescription>
              Give your new flashcard deck a title and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Deck title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Spanish Vocabulary"
                maxLength={255}
                autoFocus
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">
                Description{" "}
                <span className="text-muted-foreground/60">(optional)</span>
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this deck about?"
                rows={3}
                maxLength={5000}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => startTransition(handleCreate)}
            >
              Create Deck
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Plan Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">
              Deck limit reached
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              You&apos;ve used{" "}
              <span className="font-semibold text-foreground">
                {currentDeckCount}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">{maxDecks}</span>{" "}
              decks on the Free plan. Upgrade to{" "}
              <span className="font-semibold text-primary">Pro</span> to unlock
              unlimited decks, AI-powered generation, and more.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: "default" }), "w-full")}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Link>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsUpgradeDialogOpen(false)}
            >
              Maybe later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
