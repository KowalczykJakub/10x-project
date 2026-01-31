import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfileView() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Informacje</h1>

      <Card>
        <CardHeader>
          <CardTitle>O aplikacji</CardTitle>
          <CardDescription>
            10x-Cards - Fiszki generowane przez AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Jak to działa?</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Wklej tekst (notatki, artykuł, materiał do nauki)</li>
              <li>AI automatycznie wygeneruje propozycje fiszek</li>
              <li>Przejrzyj, edytuj i zapisz wybrane fiszki</li>
              <li>Rozpocznij sesję nauki z algorytmem powtórek</li>
            </ol>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold">Funkcje</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>🎯 <strong>Generowanie AI</strong> - Automatyczne tworzenie fiszek</li>
              <li>📚 <strong>Zarządzanie</strong> - Edycja, filtrowanie, sortowanie</li>
              <li>🎓 <strong>Sesja nauki</strong> - Immersyjny tryb z oceną trudności</li>
              <li>📊 <strong>Historia</strong> - Statystyki skuteczności generowania</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wersja MVP</CardTitle>
          <CardDescription>
            Aktualna wersja to MVP (Minimum Viable Product)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Aplikacja działa lokalnie bez wymagania logowania.
            Wszystkie dane są przechowywane w przeglądarce.
          </p>
          <p className="pt-4">
            💡 <strong>W przyszłości:</strong> Autentykacja, chmura, 
            eksport do Anki, współdzielenie zestawów i więcej!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
