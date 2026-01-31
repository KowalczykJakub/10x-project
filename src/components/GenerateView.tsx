import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TextInput from './TextInput';
import ProposalsList from './ProposalsList';
import type { FlashcardProposalDTO, CreateGenerationResponseDTO } from '@/types';

export default function GenerateView() {
  const [sourceText, setSourceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [proposals, setProposals] = useState<FlashcardProposalDTO[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const MIN_CHARS = 1000;
  const MAX_CHARS = 10000;

  const isValidLength = sourceText.length >= MIN_CHARS && sourceText.length <= MAX_CHARS;

  const handleGenerate = async () => {
    if (!isValidLength) return;

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_text: sourceText,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        if (response.status === 429) {
          throw new Error('Przekroczony limit 10 generowań na godzinę. Spróbuj ponownie później.');
        }
        
        throw new Error(data.message || 'Nie udało się wygenerować fiszek');
      }

      const data: CreateGenerationResponseDTO = await response.json();

      if (!data.proposals || data.proposals.length === 0) {
        setError('AI nie wygenerowało żadnych fiszek. Spróbuj z innym tekstem.');
        return;
      }

      setGenerationId(data.generation.id);
      setProposals(data.proposals);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveComplete = () => {
    setSuccessMessage(`Pomyślnie zapisano ${proposals.length} fiszek!`);
    setSourceText('');
    setProposals([]);
    setGenerationId(null);
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div
          className="p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md"
          role="alert"
        >
          {successMessage}
        </div>
      )}

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Wygeneruj fiszki z AI</CardTitle>
          <CardDescription>
            Wklej tekst (notatki, artykuł, materiał edukacyjny), a AI automatycznie
            wygeneruje propozycje fiszek do nauki.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TextInput
            value={sourceText}
            onChange={setSourceText}
            disabled={isGenerating}
          />

          {error && (
            <div
              className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!isValidLength || isGenerating}
              size="lg"
            >
              {isGenerating ? 'Generuję fiszki...' : 'Generuj fiszki'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <p className="text-lg font-medium">Generuję fiszki...</p>
              <p className="text-sm text-muted-foreground">
                To może potrwać 3-5 sekund
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Proposals Section */}
      {proposals.length > 0 && generationId && (
        <ProposalsList
          proposals={proposals}
          generationId={generationId}
          onSaveComplete={handleSaveComplete}
        />
      )}
    </div>
  );
}
