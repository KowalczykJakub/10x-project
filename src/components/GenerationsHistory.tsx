import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import StatsSummary from './StatsSummary';
import GenerationsTable from './GenerationsTable';
import type {
  GenerationDTO,
  GenerationStatisticsDTO,
  GenerationListResponseDTO,
} from '@/types';

export default function GenerationsHistory() {
  const [generations, setGenerations] = useState<GenerationDTO[]>([]);
  const [statistics, setStatistics] = useState<GenerationStatisticsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchGenerations();
  }, [currentPage]);

  const fetchGenerations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort: 'created_at',
        order: 'desc',
      });

      const response = await fetch(`/api/generations?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Nie udało się pobrać historii');
      }

      const data: GenerationListResponseDTO = await response.json();
      setGenerations(data.data);
      setStatistics(data.statistics);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Historia generowań</h1>
        <div className="text-center py-12 text-muted-foreground">
          Ładowanie historii...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Historia generowań</h1>
        <div
          className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
          role="alert"
        >
          {error}
        </div>
      </div>
    );
  }

  if (generations.length === 0 && currentPage === 1) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Historia generowań</h1>
        <div className="text-center py-12 space-y-4">
          <p className="text-lg text-muted-foreground">
            Nie wygenerowałeś jeszcze żadnych fiszek
          </p>
          <Button asChild>
            <a href="/generate">Wygeneruj teraz</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Historia generowań</h1>

      {/* Statistics Summary */}
      {statistics && <StatsSummary statistics={statistics} />}

      {/* Generations Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Historia</h2>
        <GenerationsTable generations={generations} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Strona {currentPage} z {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Poprzednia
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Następna
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
