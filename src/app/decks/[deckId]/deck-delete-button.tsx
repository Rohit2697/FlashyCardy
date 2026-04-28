"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import type { DeleteDeckInput } from "./schemas";

interface DeckDeleteButtonProps {
  deckId: number;
  deleteDeckAction: (input: DeleteDeckInput) => Promise<void>;
}

export function DeckDeleteButton({
  deckId,
  deleteDeckAction,
}: DeckDeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteDeckAction({ deckId });
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete deck:", error);
      setIsDeleting(false);
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        className={buttonVariants({
          variant: "destructive",
          size: "sm",
          className: "gap-1.5",
        })}
      >
        <Trash2Icon className="size-3.5" />
        Delete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Deck</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this deck? This action cannot be undone
            and all cards in this deck will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Deck"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}