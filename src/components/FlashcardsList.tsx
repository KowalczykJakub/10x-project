import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import FlashcardFilters from './FlashcardFilters';
import FlashcardsTable from './FlashcardsTable';
import FlashcardModal from './FlashcardModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import type {
  FlashcardDTO,
  FlashcardSortField,
  SortOrder,
  FlashcardSource,
  FlashcardListResponseDTO,
} from '@/types';

export default function FlashcardsList() {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [sortField, setSortField] = useState<FlashcardSortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sourceFilter, setSourceFilter] = useState<FlashcardSource | undefined>(undefined);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardDTO | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<FlashcardDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch flashcards
  const fetchFlashcards = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort: sortField,
        order: sortOrder,
      });

      if (sourceFilter) {
        params.append('source', sourceFilter);
      }

      const response = await fetch(`/api/flashcards?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Nie udało się pobrać fiszek');
      }

      const data: FlashcardListResponseDTO = await response.json();
      setFlashcards(data.data);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.total_pages);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [currentPage, sortField, sortOrder, sourceFilter]);

  const handleSortChange = (field: FlashcardSortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleSourceFilterChange = (source?: FlashcardSource) => {
    setSourceFilter(source);
    setCurrentPage(1);
  };

  const handleNewFlashcard = () => {
    setModalMode('create');
    setSelectedFlashcard(null);
    setModalOpen(true);
  };

  const handleEditFlashcard = (flashcard: FlashcardDTO) => {
    setModalMode('edit');
    setSelectedFlashcard(flashcard);
    setModalOpen(true);
  };

  const handleDeleteFlashcard = (flashcard: FlashcardDTO) => {
    setFlashcardToDelete(flashcard);
    setDeleteDialogOpen(true);
  };

  const handleSaveFlashcard = async (front: string, back: string) => {
    if (modalMode === 'create') {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ front, back }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Nie udało się utworzyć fiszki');
      }

      showSuccess('Fiszka została utworzona');
    } else if (selectedFlashcard) {
      const response = await fetch(`/api/flashcards/${selectedFlashcard.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ front, back }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Nie udało się zaktualizować fiszki');
      }

      showSuccess('Fiszka została zaktualizowana');
    }

    await fetchFlashcards();
  };

  const confirmDelete = async () => {
    if (!flashcardToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/flashcards/${flashcardToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Nie udało się usunąć fiszki');
      }

      showSuccess('Fiszka została usunięta');
      setDeleteDialogOpen(false);
      setFlashcardToDelete(null);
      await fetchFlashcards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas usuwania');
    } finally {
      setIsDeleting(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Moje fiszki</h1>
        {total > 0 && (
          <p className="text-sm text-muted-foreground">
            Łącznie: {total} {total === 1 ? 'fiszka' : 'fiszek'}
          </p>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          className="p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md"
          role="alert"
        >
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <FlashcardFilters
        sortField={sortField}
        sortOrder={sortOrder}
        sourceFilter={sourceFilter}
        onSortChange={handleSortChange}
        onSourceFilterChange={handleSourceFilterChange}
        onNewFlashcard={handleNewFlashcard}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Ładowanie...
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <FlashcardsTable
          flashcards={flashcards}
          onEdit={handleEditFlashcard}
          onDelete={handleDeleteFlashcard}
        />
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
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

      {/* Modals */}
      <FlashcardModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        flashcard={selectedFlashcard}
        onSave={handleSaveFlashcard}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
