import { useState, type ChangeEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;
const OPTIMAL_START = 2000;
const OPTIMAL_END = 9000;

export default function TextInput({ value, onChange, disabled }: TextInputProps) {
  const charCount = value.length;

  const getCounterColor = (): string => {
    if (charCount < MIN_CHARS) return 'text-red-600';
    if (charCount < OPTIMAL_START) return 'text-yellow-600';
    if (charCount <= OPTIMAL_END) return 'text-green-600';
    if (charCount <= MAX_CHARS) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCounterMessage = (): string => {
    if (charCount < MIN_CHARS) {
      return `Minimum ${MIN_CHARS} znaków`;
    }
    if (charCount > MAX_CHARS) {
      return `Maksimum ${MAX_CHARS} znaków`;
    }
    return 'Długość tekstu jest odpowiednia';
  };

  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="source-text" className="text-sm font-medium block">
        Tekst źródłowy
      </label>
      
      <Textarea
        id="source-text"
        placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki (1000-10000 znaków)..."
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="min-h-[300px] resize-y"
        aria-invalid={!isValid && charCount > 0}
        aria-describedby="char-counter"
      />
      
      <div
        id="char-counter"
        className="flex justify-between items-center text-sm"
        aria-live="polite"
      >
        <span className={cn('font-medium', getCounterColor())}>
          {charCount} / {MAX_CHARS} znaków
        </span>
        <span className={cn('text-muted-foreground', getCounterColor())}>
          {getCounterMessage()}
        </span>
      </div>
    </div>
  );
}
