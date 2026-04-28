"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Card {
  id: number;
  front: string;
  back: string;
}

interface StudyClientProps {
  deckId: number;
  cards: Card[];
}

export function StudyClient({ deckId, cards: initialCards }: StudyClientProps) {
  // Shuffle function
  const shuffleCards = useCallback((cardsArray: Card[]) => {
    const shuffled = [...cardsArray];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Study state
  const [cards, setCards] = useState<Card[]>(() => shuffleCards(initialCards));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answered, setAnswered] = useState(false);

  const currentCard = cards[currentIndex];

  function handleFlip() {
    if (!answered) {
      setIsFlipped(!isFlipped);
    }
  }

  function handleAnswer(correct: boolean) {
    if (answered) return;

    setAnswered(true);
    if (correct) {
      setScore(score + 1);
    }
  }

  function handleNext() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setAnswered(false);
    } else {
      setShowResults(true);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setAnswered(false);
    }
  }

  function handleRestart() {
    setCards(shuffleCards(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setScore(0);
    setShowResults(false);
    setAnswered(false);
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showResults) return;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevious();
          break;
        case " ":
          e.preventDefault();
          handleFlip();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isFlipped, answered, showResults, cards.length]);

  if (cards.length === 0) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6">
        <p className="text-lg text-muted-foreground">
          No cards in this deck to study.
        </p>
        <Link
          href={`/decks/${deckId}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to Deck
        </Link>
      </main>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / cards.length) * 100);
    let message = "";
    if (percentage === 100) {
      message = "Perfect score! 🎉";
    } else if (percentage >= 80) {
      message = "Great job! 👏";
    } else if (percentage >= 60) {
      message = "Good effort! 💪";
    } else {
      message = "Keep practicing! 📚";
    }

    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background px-6 py-10">
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Study Complete!
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-6xl font-bold text-green-600">{score}/{cards.length}</p>
            <p className="text-2xl text-muted-foreground">{percentage}%</p>
            <p className="text-lg text-muted-foreground">{message}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className={cn(buttonVariants({ variant: "default" }), "bg-blue-600 hover:bg-blue-700")}
            >
              Study Again
            </button>
            <Link
              href={`/decks/${deckId}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back to Deck
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
        {/* Progress */}
        <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
          <div className="flex gap-2">
            <Link
              href={`/decks/${deckId}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              ← Back
            </Link>
            <button
              onClick={handleRestart}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              title="Reset and shuffle cards"
            >
              🔄 Reset
            </button>
          </div>
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="text-green-600">Score: {score}</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-green-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        <div
          onClick={handleFlip}
          className={cn(
            "flex h-64 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-border bg-card p-8 text-center transition-all duration-300",
            isFlipped ? "border-green-500 bg-green-50 dark:bg-green-950" : "hover:border-muted-foreground"
          )}
        >
          <p className="text-2xl font-medium text-foreground">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {isFlipped ? "Did you know the answer?" : "Click card or press Space to reveal answer"}
        </p>

        {/* Keyboard hints */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>← Previous</span>
          <span>Space: Flip</span>
          <span>Next →</span>
        </div>

        {/* Answer buttons */}
        {isFlipped && !answered && (
          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer(false)}
              className={cn(buttonVariants({ variant: "default" }), "bg-red-600 hover:bg-red-700 px-8")}
            >
              Wrong
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className={cn(buttonVariants({ variant: "default" }), "bg-green-600 hover:bg-green-700 px-8")}
            >
              Correct
            </button>
          </div>
        )}

        {/* Next button after answering */}
        {answered && (
          <button
            onClick={handleNext}
            className={cn(buttonVariants({ variant: "default" }), "bg-blue-600 hover:bg-blue-700 px-8")}
          >
            {currentIndex < cards.length - 1 ? "Next Card →" : "See Results"}
          </button>
        )}
      </div>
    </main>
  );
}
