import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ProposalRow from './ProposalRow';
import type { FlashcardProposalDTO } from '@/types';

interface ProposalsListProps {
  proposals: FlashcardProposalDTO[];
  generationId: number;
  onSaveComplete: () => void;
}

interface EditableProposal extends FlashcardProposalDTO {
  id: string;
  edited: boolean;
}

export default function ProposalsList({
  proposals,
  generationId,
  onSaveComplete,
}: ProposalsListProps) {
  const [editableProposals, setEditableProposals] = useState<EditableProposal[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize proposals with IDs and edited flags
    const initialized = proposals.map((p, index) => ({
      ...p,
      id: `proposal-${index}`,
      edited: false,
    }));
    setEditableProposals(initialized);
    
    // Select all by default
    const allIds = new Set(initialized.map(p => p.id));
    setSelectedIds(allIds);
  }, [proposals]);

  useEffect(() => {
    // Warn before leaving if there are unsaved proposals
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editableProposals.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editableProposals]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleUpdateProposal = (id: string, front: string, back: string) => {
    setEditableProposals((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, front, back, edited: true } : p
      )
    );
  };

  const handleSaveSelected = async () => {
    const selectedProposals = editableProposals
      .filter((p) => selectedIds.has(p.id))
      .map((p) => ({
        front: p.front,
        back: p.back,
        edited: p.edited,
      }));

    if (selectedProposals.length === 0) {
      setError('Wybierz przynajmniej jedną fiszkę do zapisania');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/flashcards/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generation_id: generationId,
          flashcards: selectedProposals,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Nie udało się zapisać fiszek');
      }

      // Success - call callback to show success message and clear proposals
      onSaveComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas zapisywania');
    } finally {
      setIsSaving(false);
    }
  };

  if (editableProposals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Propozycje fiszek</h2>
        <p className="text-sm text-muted-foreground">
          Wybrane: {selectedIds.size} / {editableProposals.length}
        </p>
      </div>

      {error && (
        <div
          className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <span className="sr-only">Zaznacz</span>
              </TableHead>
              <TableHead className="w-[40%]">Przód</TableHead>
              <TableHead className="w-[40%]">Tył</TableHead>
              <TableHead className="w-[120px]">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editableProposals.map((proposal, index) => (
              <ProposalRow
                key={proposal.id}
                proposal={proposal}
                index={index}
                isSelected={selectedIds.has(proposal.id)}
                onToggleSelect={() => handleToggleSelect(proposal.id)}
                onUpdate={(front, back) =>
                  handleUpdateProposal(proposal.id, front, back)
                }
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveSelected}
          disabled={isSaving || selectedIds.size === 0}
          size="lg"
        >
          {isSaving
            ? 'Zapisywanie...'
            : `Zapisz wybrane fiszki (${selectedIds.size})`}
        </Button>
      </div>
    </div>
  );
}
