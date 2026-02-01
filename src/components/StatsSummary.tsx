import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GenerationStatisticsDTO } from "@/types";

interface StatsSummaryProps {
  statistics: GenerationStatisticsDTO;
}

export default function StatsSummary({ statistics }: StatsSummaryProps) {
  const acceptanceRate = (statistics.acceptance_rate * 100).toFixed(1);

  const getAcceptanceRateColor = (rate: number): string => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Generations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Łączna liczba generowań</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{statistics.total_generations}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {statistics.total_flashcards_generated} fiszek wygenerowanych
          </p>
        </CardContent>
      </Card>

      {/* Average Acceptance Rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Średni wskaźnik akceptacji</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold ${getAcceptanceRateColor(statistics.acceptance_rate * 100)}`}>
            {acceptanceRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {statistics.total_flashcards_accepted} z {statistics.total_flashcards_generated} zaakceptowanych
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
