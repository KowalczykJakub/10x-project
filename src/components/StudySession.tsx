import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import FlashcardDisplay from "./FlashcardDisplay";
import type { FlashcardDTO, FlashcardListResponseDTO } from "@/types";

export default function StudySession() {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    fetchFlashcards();
  }, []);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isComplete || isLoading) return;

      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        // Space bar to reveal - handled in FlashcardDisplay component
      } else if (e.code === "Digit1") {
        handleRate("hard");
      } else if (e.code === "Digit2") {
        handleRate("medium");
      } else if (e.code === "Digit3") {
        handleRate("easy");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, isComplete, isLoading]);

  const fetchFlashcards = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all flashcards (no pagination for study session)
      const response = await fetch("/api/flashcards?limit=100");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Nie udało się pobrać fiszek");
      }

      const data: FlashcardListResponseDTO = await response.json();

      if (data.data.length === 0) {
        setError("no-flashcards");
        return;
      }

      // Shuffle flashcards for variety
      const shuffled = [...data.data].sort(() => Math.random() - 0.5);
      setFlashcards(shuffled);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = () => {
    setReviewedCount((prev) => prev + 1);

    // Move to next flashcard
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }

    // In MVP, we don't persist ratings to API
    // In future: send rating to API for spaced repetition algorithm
  };

  const handleExit = () => {
    if (window.confirm("Czy na pewno chcesz przerwać sesję nauki?")) {
      window.location.href = "/flashcards";
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setReviewedCount(0);
    setIsComplete(false);
    // Re-shuffle
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p className="text-lg font-medium">Ładowanie fiszek...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error: No flashcards
  if (error === "no-flashcards") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center">Brak fiszek do nauki</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Nie masz jeszcze żadnych fiszek. Wygeneruj fiszki z AI lub dodaj je ręcznie.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <a href="/generate">Wygeneruj fiszki</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/flashcards">Dodaj ręcznie</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error: Other errors
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Błąd podczas ładowania</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchFlashcards}>Spróbuj ponownie</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion screen
  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">🎉 Sesja ukończona!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">{reviewedCount}</p>
              <p className="text-muted-foreground">{reviewedCount === 1 ? "fiszka" : "fiszek"} przejrzanych</p>
            </div>
            <p className="text-lg">Dobra robota! Wróć jutro, aby powtórzyć materiał.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleRestart}>Rozpocznij ponownie</Button>
              <Button variant="outline" asChild>
                <a href="/flashcards">Moje fiszki</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Study session
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with progress and exit */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              Fiszka {currentIndex + 1} z {flashcards.length}
            </p>
            <Button variant="ghost" size="sm" onClick={handleExit} aria-label="Zakończ sesję">
              ✕ Wyjdź
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Flashcard display */}
      <div className="container mx-auto px-4 py-8">
        <FlashcardDisplay flashcard={flashcards[currentIndex]} onRate={handleRate} />
      </div>
    </div>
  );
}
