"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { UpdateDeckInput } from "./schemas";

type DeckEditButtonProps = {
  deckId: number;
  initialTitle: string;
  initialDescription: string | null;
  updateDeckAction: (input: UpdateDeckInput) => Promise<void>;
};

export function DeckEditButton({
  deckId,
  initialTitle,
  initialDescription,
  updateDeckAction,
}: DeckEditButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [pending, startTransition] = useTransition();

  function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return "Unable to update deck right now. Please try again.";
  }

  function openDialog() {
    setTitle(initialTitle);
    setDescription(initialDescription ?? "");
    setIsDialogOpen(true);
  }

  async function handleSave() {
    const nextTitle = title.trim();
    const nextDescription = description.trim();

    if (!nextTitle) {
      toast.error("Deck title is required.");
      return;
    }

    const loadingToastId = toast.loading("Updating deck...");
    try {
      await updateDeckAction({
        deckId,
        title: nextTitle,
        description: nextDescription ? nextDescription : null,
      });
      setIsDialogOpen(false);
      toast.success("Deck updated successfully.", { id: loadingToastId });
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error), { id: loadingToastId });
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={openDialog}
      >
        Edit Deck
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Deck</DialogTitle>
          <DialogDescription>
            Update your deck title and description.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Deck title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Deck description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
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
            Close
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => startTransition(handleSave)}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
