import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TableCell, TableRow } from '@/components/ui/table';
import type { FlashcardProposalDTO } from '@/types';

interface ProposalRowProps {
  proposal: FlashcardProposalDTO;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdate: (front: string, back: string) => void;
}

const MAX_FRONT = 200;
const MAX_BACK = 500;

export default function ProposalRow({
  proposal,
  index,
  isSelected,
  onToggleSelect,
  onUpdate,
}: ProposalRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFront, setEditFront] = useState(proposal.front);
  const [editBack, setEditBack] = useState(proposal.back);

  const handleSave = () => {
    if (editFront.trim() && editBack.trim()) {
      onUpdate(editFront.trim(), editBack.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditFront(proposal.front);
    setEditBack(proposal.back);
    setIsEditing(false);
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Zaznacz fiszkę ${index + 1}`}
          />
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <Textarea
              value={editFront}
              onChange={(e) => setEditFront(e.target.value)}
              maxLength={MAX_FRONT}
              className="min-h-[80px]"
              aria-label="Edytuj przód fiszki"
            />
            <span className="text-xs text-muted-foreground">
              {editFront.length}/{MAX_FRONT}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <Textarea
              value={editBack}
              onChange={(e) => setEditBack(e.target.value)}
              maxLength={MAX_BACK}
              className="min-h-[80px]"
              aria-label="Edytuj tył fiszki"
            />
            <span className="text-xs text-muted-foreground">
              {editBack.length}/{MAX_BACK}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!editFront.trim() || !editBack.trim()}
            >
              Zapisz
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Anuluj
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Zaznacz fiszkę ${index + 1}`}
        />
      </TableCell>
      <TableCell className="max-w-xs">
        <p className="whitespace-pre-wrap break-words">
          {truncate(proposal.front, 100)}
        </p>
      </TableCell>
      <TableCell className="max-w-xs">
        <p className="whitespace-pre-wrap break-words">
          {truncate(proposal.back, 100)}
        </p>
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(true)}
        >
          Edytuj
        </Button>
      </TableCell>
    </TableRow>
  );
}
