import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FlashcardDTO } from '@/types';

interface FlashcardsTableProps {
  flashcards: FlashcardDTO[];
  onEdit: (flashcard: FlashcardDTO) => void;
  onDelete: (flashcard: FlashcardDTO) => void;
}

const getSourceLabel = (source: string): string => {
  switch (source) {
    case 'ai-full':
      return 'AI';
    case 'ai-edited':
      return 'AI (edytowane)';
    case 'manual':
      return 'Ręczne';
    default:
      return source;
  }
};

const truncate = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default function FlashcardsTable({
  flashcards,
  onEdit,
  onDelete,
}: FlashcardsTableProps) {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Nie masz jeszcze żadnych fiszek</p>
        <p className="text-sm mt-2">
          Wygeneruj fiszki z AI lub dodaj je ręcznie
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Przód</TableHead>
            <TableHead className="w-[35%]">Tył</TableHead>
            <TableHead className="w-[15%]">Źródło</TableHead>
            <TableHead className="w-[15%] text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flashcards.map((flashcard) => (
            <TableRow key={flashcard.id}>
              <TableCell className="max-w-xs">
                <p className="whitespace-pre-wrap break-words">
                  {truncate(flashcard.front, 100)}
                </p>
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="whitespace-pre-wrap break-words">
                  {truncate(flashcard.back, 100)}
                </p>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {getSourceLabel(flashcard.source)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(flashcard)}
                    aria-label={`Edytuj fiszkę: ${flashcard.front}`}
                  >
                    Edytuj
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(flashcard)}
                    aria-label={`Usuń fiszkę: ${flashcard.front}`}
                  >
                    Usuń
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
