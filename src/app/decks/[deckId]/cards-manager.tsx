"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  CreateCardInput,
  DeleteCardInput,
  UpdateCardInput,
} from "./schemas";

type DeckCard = {
  id: number;
  front: string;
  back: string;
  updatedAt: string;
};

type DeckCardsManagerProps = {
  deckId: number;
  cards: DeckCard[];
  createCardAction: (input: CreateCardInput) => Promise<void>;
  updateCardAction: (input: UpdateCardInput) => Promise<void>;
  deleteCardAction: (input: DeleteCardInput) => Promise<void>;
};

export function DeckCardsManager({
  deckId,
  cards,
  createCardAction,
  updateCardAction,
  deleteCardAction,
}: DeckCardsManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<number | null>(null);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    []
  );

  function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return "Something went wrong. Please try again.";
  }

  async function handleCreateCard() {
    const front = newFront.trim();
    const back = newBack.trim();
    if (!front || !back) {
      toast.error("Please fill both Front and Back before saving.");
      return;
    }

    const loadingToastId = toast.loading("Creating card...");
    try {
      await createCardAction({ deckId, front, back });
      setNewFront("");
      setNewBack("");
      setIsAddDialogOpen(false);
      toast.success("Card created successfully.", { id: loadingToastId });
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error), { id: loadingToastId });
    }
  }

  async function handleUpdateCard(cardId: number) {
    const front = editFront.trim();
    const back = editBack.trim();
    if (!front || !back) {
      toast.error("Please fill both Front and Back before saving.");
      return;
    }

    const loadingToastId = toast.loading("Saving card changes...");
    try {
      await updateCardAction({ deckId, cardId, front, back });
      setEditingCardId(null);
      setEditFront("");
      setEditBack("");
      setIsEditDialogOpen(false);
      toast.success("Card updated successfully.", { id: loadingToastId });
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error), { id: loadingToastId });
    }
  }

  function openEditDialog(card: DeckCard) {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(cardId: number) {
    setDeletingCardId(cardId);
    setIsDeleteDialogOpen(true);
  }

  async function confirmDeleteCard() {
    if (deletingCardId === null) return;
    
    const loadingToastId = toast.loading("Deleting card...");
    try {
      await deleteCardAction({ deckId, cardId: deletingCardId });
      setIsDeleteDialogOpen(false);
      setDeletingCardId(null);
      toast.success("Card deleted successfully.", { id: loadingToastId });
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error), { id: loadingToastId });
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setIsAddDialogOpen(true)}>
          Add Card
        </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Card</DialogTitle>
              <DialogDescription>
                Fill in the front and back content, then save.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Front</span>
                <textarea
                  value={newFront}
                  onChange={(event) => setNewFront(event.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Back</span>
                <textarea
                  value={newBack}
                  onChange={(event) => setNewBack(event.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => startTransition(handleCreateCard)}
              >
                Save Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Card</DialogTitle>
              <DialogDescription>
                Update the front and back content, then save.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Front</span>
                <textarea
                  value={editFront}
                  onChange={(event) => setEditFront(event.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Back</span>
                <textarea
                  value={editBack}
                  onChange={(event) => setEditBack(event.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await handleUpdateCard(editingCardId!);
                  })
                }
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Card</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this card? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingCardId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await confirmDeleteCard();
                  })
                }
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              No cards yet. Use the Add Card button when you are ready.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const createdDate = dateFormatter.format(new Date(card.updatedAt));
            const isEditing = editingCardId === card.id;

            return (
              <li key={card.id} className="h-[360px] w-full max-w-[320px]">
                <Card className="flex h-full flex-col">
                  <CardHeader className="gap-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Created: {createdDate}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="grid flex-1 gap-3 overflow-y-auto">
                    <div className="grid gap-1 rounded-md border border-border bg-muted/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Front
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm">{card.front}</p>
                    </div>
                    <div className="grid gap-1 rounded-md border border-border bg-muted/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Back
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm">{card.back}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openEditDialog(card)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={pending}
                        onClick={() => openDeleteDialog(card.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
