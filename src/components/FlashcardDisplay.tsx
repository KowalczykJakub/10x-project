import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FlashcardDTO } from "@/types";

interface FlashcardDisplayProps {
  flashcard: FlashcardDTO;
  onRate: (rating: "hard" | "medium" | "easy") => void;
}

export default function FlashcardDisplay({ flashcard, onRate }: FlashcardDisplayProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleRate = (rating: "hard" | "medium" | "easy") => {
    setIsRevealed(false);
    onRate(rating);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 md:p-12">
          {/* Front of card - always visible */}
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Przód fiszki</p>
              <p className="text-2xl md:text-3xl font-medium whitespace-pre-wrap">{flashcard.front}</p>
            </div>

            {/* Back of card - shown after reveal */}
            {isRevealed && (
              <div className="pt-6 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Tył fiszki</p>
                  <p className="text-xl md:text-2xl whitespace-pre-wrap">{flashcard.back}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      {!isRevealed ? (
        <Button size="lg" onClick={handleReveal} className="min-w-[200px]">
          Pokaż odpowiedź
        </Button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleRate("hard")}
            className="min-w-[150px] border-red-500 text-red-600 hover:bg-red-50"
          >
            🔴 Trudne
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleRate("medium")}
            className="min-w-[150px] border-yellow-500 text-yellow-600 hover:bg-yellow-50"
          >
            🟡 Średnie
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleRate("easy")}
            className="min-w-[150px] border-green-500 text-green-600 hover:bg-green-50"
          >
            🟢 Łatwe
          </Button>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <p className="text-xs text-muted-foreground text-center">
        {!isRevealed ? "Naciśnij Spację, aby pokazać odpowiedź" : "Naciśnij 1 (Trudne), 2 (Średnie) lub 3 (Łatwe)"}
      </p>
    </div>
  );
}
