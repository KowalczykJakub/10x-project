import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FlashcardSortField, SortOrder, FlashcardSource } from "@/types";

interface FlashcardFiltersProps {
  sortField: FlashcardSortField;
  sortOrder: SortOrder;
  sourceFilter?: FlashcardSource;
  onSortChange: (field: FlashcardSortField, order: SortOrder) => void;
  onSourceFilterChange: (source?: FlashcardSource) => void;
  onNewFlashcard: () => void;
}

export default function FlashcardFilters({
  sortField,
  sortOrder,
  sourceFilter,
  onSortChange,
  onSourceFilterChange,
  onNewFlashcard,
}: FlashcardFiltersProps) {
  const handleSortChange = (value: string) => {
    switch (value) {
      case "newest":
        onSortChange("created_at", "desc");
        break;
      case "oldest":
        onSortChange("created_at", "asc");
        break;
      case "alphabetical":
        onSortChange("front", "asc");
        break;
    }
  };

  const handleSourceChange = (value: string) => {
    if (value === "all") {
      onSourceFilterChange(undefined);
    } else {
      onSourceFilterChange(value as FlashcardSource);
    }
  };

  const getSortValue = (): string => {
    if (sortField === "front") return "alphabetical";
    if (sortField === "created_at" && sortOrder === "desc") return "newest";
    if (sortField === "created_at" && sortOrder === "asc") return "oldest";
    return "newest";
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-wrap gap-3">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium">
            Sortuj:
          </label>
          <Select value={getSortValue()} onValueChange={handleSortChange}>
            <SelectTrigger id="sort-select" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Najnowsze</SelectItem>
              <SelectItem value="oldest">Najstarsze</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Source Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="source-select" className="text-sm font-medium">
            Źródło:
          </label>
          <Select value={sourceFilter || "all"} onValueChange={handleSourceChange}>
            <SelectTrigger id="source-select" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="ai-full">AI (pełne)</SelectItem>
              <SelectItem value="ai-edited">AI (edytowane)</SelectItem>
              <SelectItem value="manual">Ręczne</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* New Flashcard Button */}
      <Button onClick={onNewFlashcard}>+ Nowa fiszka</Button>
    </div>
  );
}
