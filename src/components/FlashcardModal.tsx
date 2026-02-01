import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardDTO } from "@/types";

interface FlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  flashcard?: FlashcardDTO | null;
  onSave: (front: string, back: string) => Promise<void>;
}

const MAX_FRONT = 200;
const MAX_BACK = 500;

export default function FlashcardModal({ open, onOpenChange, mode, flashcard, onSave }: FlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && flashcard) {
        setFront(flashcard.front);
        setBack(flashcard.back);
      } else {
        setFront("");
        setBack("");
      }
      setError(null);
    }
  }, [open, mode, flashcard]);

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) {
      setError("Oba pola są wymagane");
      return;
    }

    if (front.length > MAX_FRONT) {
      setError(`Przód fiszki może mieć maksymalnie ${MAX_FRONT} znaków`);
      return;
    }

    if (back.length > MAX_BACK) {
      setError(`Tył fiszki może mieć maksymalnie ${MAX_BACK} znaków`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(front.trim(), back.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać fiszki");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Nowa fiszka" : "Edytuj fiszkę"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Stwórz nową fiszkę ręcznie" : "Edytuj treść istniejącej fiszki"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div
              className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Front Field */}
          <div className="space-y-2">
            <label htmlFor="flashcard-front" className="text-sm font-medium">
              Przód fiszki
            </label>
            <Textarea
              id="flashcard-front"
              name="front"
              placeholder="Pytanie lub pojęcie..."
              value={front}
              onChange={(e) => setFront(e.target.value)}
              maxLength={MAX_FRONT}
              className="min-h-[100px]"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground text-right">
              {front.length} / {MAX_FRONT}
            </p>
          </div>

          {/* Back Field */}
          <div className="space-y-2">
            <label htmlFor="flashcard-back" className="text-sm font-medium">
              Tył fiszki
            </label>
            <Textarea
              id="flashcard-back"
              name="back"
              placeholder="Odpowiedź lub wyjaśnienie..."
              value={back}
              onChange={(e) => setBack(e.target.value)}
              maxLength={MAX_BACK}
              className="min-h-[150px]"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground text-right">
              {back.length} / {MAX_BACK}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !front.trim() || !back.trim()}>
            {isSaving ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
