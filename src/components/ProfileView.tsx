import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseBrowser } from "@/db/supabase-browser";

interface UserProfile {
  email: string;
  createdAt: string;
  emailVerified: boolean;
}

export default function ProfileView() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabaseBrowser.auth.getUser();

        if (error || !user) {
          // eslint-disable-next-line no-console
          console.error("Failed to fetch user:", error);
          return;
        }

        setProfile({
          email: user.email || "",
          createdAt: user.created_at || "",
          emailVerified: !!user.email_confirmed_at,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Profil</h1>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-sm text-muted-foreground">Ładowanie profilu...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profil</h1>

      {/* User Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informacje o koncie</CardTitle>
          <CardDescription>Twoje dane użytkownika</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Email</span>
            <p className="text-base">{profile?.email || "Brak danych"}</p>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Status weryfikacji</span>
            <div className="flex items-center gap-2">
              {profile?.emailVerified ? (
                <>
                  <span className="text-green-600">✓</span>
                  <p className="text-base">Email zweryfikowany</p>
                </>
              ) : (
                <>
                  <span className="text-yellow-600">⚠</span>
                  <p className="text-base">Email niezweryfikowany</p>
                  <p className="text-sm text-muted-foreground">(Sprawdź swoją skrzynkę email)</p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Data utworzenia konta</span>
            <p className="text-base">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("pl-PL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Brak danych"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About the App */}
      <Card>
        <CardHeader>
          <CardTitle>O aplikacji</CardTitle>
          <CardDescription>10x-Cards - Fiszki generowane przez AI</CardDescription>
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
              <li>
                🎯 <strong>Generowanie AI</strong> - Automatyczne tworzenie fiszek
              </li>
              <li>
                📚 <strong>Zarządzanie</strong> - Edycja, filtrowanie, sortowanie
              </li>
              <li>
                🎓 <strong>Sesja nauki</strong> - Immersyjny tryb z oceną trudności
              </li>
              <li>
                📊 <strong>Historia</strong> - Statystyki skuteczności generowania
              </li>
              <li>
                🔐 <strong>Bezpieczeństwo</strong> - Twoje dane są prywatne i chronione
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
