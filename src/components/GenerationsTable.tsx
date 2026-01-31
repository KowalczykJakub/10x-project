import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GenerationDTO } from '@/types';

interface GenerationsTableProps {
  generations: GenerationDTO[];
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getAcceptanceRateColor = (rate: number): string => {
  if (rate >= 80) return 'text-green-600 font-semibold';
  if (rate >= 60) return 'text-yellow-600 font-semibold';
  return 'text-red-600 font-semibold';
};

const calculateAcceptanceRate = (generation: GenerationDTO): number => {
  if (generation.generated_count === 0) return 0;
  const accepted = generation.accepted_unedited_count + generation.accepted_edited_count;
  return (accepted / generation.generated_count) * 100;
};

export default function GenerationsTable({ generations }: GenerationsTableProps) {
  if (generations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Nie masz jeszcze historii generowań</p>
        <p className="text-sm mt-2">
          Wygeneruj pierwsze fiszki, aby zobaczyć statystyki
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Data</TableHead>
            <TableHead className="w-[20%]">Model AI</TableHead>
            <TableHead className="w-[15%] text-center">Wygenerowane</TableHead>
            <TableHead className="w-[15%] text-center">Zaakceptowane</TableHead>
            <TableHead className="w-[20%] text-right">Wskaźnik akceptacji</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {generations.map((generation) => {
            const acceptanceRate = calculateAcceptanceRate(generation);
            const acceptedTotal =
              generation.accepted_unedited_count + generation.accepted_edited_count;

            return (
              <TableRow key={generation.id}>
                <TableCell>
                  <span className="text-sm">{formatDate(generation.created_at)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-muted-foreground">
                    {generation.model}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium">
                    {generation.generated_count}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium">{acceptedTotal}</span>
                  {generation.accepted_edited_count > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({generation.accepted_edited_count} edited)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`text-sm ${getAcceptanceRateColor(acceptanceRate)}`}>
                    {acceptanceRate.toFixed(1)}%
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
