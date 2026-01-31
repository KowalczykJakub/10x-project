# Architektura UI dla 10x-Cards

## 1. Przegląd struktury UI

### 1.1 Wprowadzenie

Aplikacja 10x-Cards to edukacyjna platforma webowa umożliwiająca użytkownikom szybkie tworzenie i zarządzanie fiszkami do nauki z wykorzystaniem sztucznej inteligencji. Architektura UI została zaprojektowana z myślą o maksymalnej prostocie, intuicyjności i efektywności, aby umożliwić użytkownikom skupienie się na nauce, a nie na obsłudze narzędzia.

### 1.2 Podstawowe założenia projektowe

- **Minimalizm**: Każdy element interfejsu ma jasno określony cel
- **Prostota obsługi**: Flat structure nawigacji bez zagnieżdżeń
- **Responsywność**: Mobile-first approach z pełnym wsparciem dla desktopów
- **Dostępność**: Zgodność z WCAG AA dla szerokiego grona użytkowników
- **Spójność**: Wykorzystanie biblioteki Shadcn/ui dla jednolitego wyglądu

### 1.3 Technologie i narzędzia

- **Framework**: Astro 5 (static pages + SSR dla API)
- **Komponenty interaktywne**: React 19
- **Styling**: Tailwind CSS 4
- **Biblioteka UI**: Shadcn/ui
- **Język**: TypeScript 5
- **Autentykacja**: Supabase Auth
- **Algorytm powtórek**: ts-fsrs (lub podobna biblioteka open-source)

### 1.4 Główne obszary funkcjonalne

1. **Autentykacja** - Logowanie i rejestracja użytkowników
2. **Generowanie fiszek** - Tworzenie fiszek z wykorzystaniem AI
3. **Zarządzanie fiszkami** - Przeglądanie, edycja, usuwanie fiszek
4. **Sesja nauki** - Immersyjne środowisko do nauki z algorytmem spaced repetition
5. **Historia generowania** - Analiza statystyk i skuteczności generowania AI
6. **Profil użytkownika** - Zarządzanie kontem

---

## 2. Lista widoków

### 2.1 Widok: Strona główna / Autentykacja

**Ścieżka**: `/`

**Główny cel**: Umożliwienie nowym użytkownikom rejestracji oraz istniejącym użytkownikom zalogowania się do aplikacji.

**Kluczowe informacje do wyświetlenia**:
- Przełącznik między formularzem logowania a rejestracją
- Pola wprowadzania: email i hasło
- Komunikaty o błędach walidacji
- Informacje o marce (logo, tagline)

**Kluczowe komponenty widoku**:
- `AuthForm.tsx` - Komponent React z logiką formularza
- Shadcn/ui: `Card`, `Input`, `Button`
- Walidacja inline (email format, minimalna długość hasła)

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: Płynne przełączanie między trybami (login/rejestracja) bez przeładowania strony
- **Dostępność**: Pola formularza z odpowiednimi labelami, komunikaty błędów ogłaszane przez screen readery
- **Bezpieczeństwo**: Hasła maskowane, HTTPS only, brak przechowywania hasła w plain text, wykorzystanie Supabase Auth

**Integracja z API**:
- Supabase Auth SDK: `signUp()`, `signIn()`
- Po sukcesie: przekierowanie do `/generate`
- Błędy: wyświetlanie inline pod polami formularza

**Stany i przypadki brzegowe**:
- Loading state podczas weryfikacji danych
- Błąd sieci - komunikat z możliwością retry
- Błąd walidacji - podświetlenie pól z błędami
- Konto już istnieje - komunikat z linkiem do logowania

---

### 2.2 Widok: Generowanie fiszek

**Ścieżka**: `/generate`

**Główny cel**: Umożliwienie użytkownikowi wklejenia tekstu źródłowego i wygenerowania propozycji fiszek przy użyciu AI, a następnie przeglądu, edycji i zaakceptowania wybranych propozycji.

**Kluczowe informacje do wyświetlenia**:

**Faza 1 - Wprowadzanie tekstu**:
- Duże pole tekstowe (textarea) na tekst źródłowy
- Licznik znaków z kolorowym wskaźnikiem (czerwony: <1000, żółty: 1000-2000, zielony: 2000-9000, pomarańczowy: 9000-10000)
- Przycisk "Generuj fiszki" (disabled gdy walidacja nie przechodzi)
- Informacja o limicie znaków (1000-10000)

**Faza 2 - Przegląd propozycji**:
- Tabela z wygenerowanymi propozycjami fiszek
- Kolumny: [Checkbox | Przód (przycięty) | Tył (przycięty) | Przycisk edycji]
- Tryb edycji inline: pola textarea dla przodu i tyłu, przyciski zapisz/anuluj
- Licznik wybranych fiszek: "Wybrane: X/Y"
- Przycisk "Zapisz wybrane fiszki" na dole

**Kluczowe komponenty widoku**:
- `TextInput.tsx` - Textarea z walidacją i licznikiem
- `ProposalsList.tsx` - Tabela z propozycjami
- `ProposalRow.tsx` - Pojedynczy wiersz z możliwością edycji
- Shadcn/ui: `Textarea`, `Button`, `Table`, `Checkbox`
- Overlay ze spinnerem podczas generowania

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Wyraźny feedback wizualny dla licznika znaków
  - Ostrzeżenie `window.onbeforeunload` gdy są niezapisane propozycje
  - Loading overlay podczas wywołania API (3-5 sekund)
  - Płynne przejście między fazami
- **Dostępność**: 
  - Textarea z labelą i opisem wymagań
  - Status licznika ogłaszany przez ARIA live region
  - Tabela z odpowiednimi nagłówkami
  - Przyciski z tekstowymi labelami
- **Bezpieczeństwo**: 
  - Walidacja długości tekstu po stronie klienta i serwera
  - Token JWT w nagłówku Authorization
  - Sanityzacja danych przed wyświetleniem

**Integracja z API**:
1. `POST /api/generations` - generowanie propozycji (zwraca generation_id + array proposals)
2. Propozycje przechowywane w local React state
3. `POST /api/flashcards/batch` - zapis zaakceptowanych fiszek z flagami edited

**Stany i przypadki brzegowe**:
- **Loading**: Spinner overlay z tekstem "Generuję fiszki..."
- **Błąd 400**: Toast z informacją o nieprawidłowej długości tekstu
- **Błąd 429**: Toast z informacją o limicie (10/godz) i czasem retry
- **Błąd 500**: Modal z opcją retry lub kontakt
- **Sukces**: Toast potwierdzający zapis, czyszczenie state, opcjonalne przekierowanie do `/flashcards`
- **Pusta lista propozycji**: Komunikat "AI nie wygenerowało żadnych fiszek. Spróbuj z innym tekstem"
- **Utrata połączenia**: Toast z możliwością retry

---

### 2.3 Widok: Moje fiszki

**Ścieżka**: `/flashcards`

**Główny cel**: Przeglądanie wszystkich zapisanych fiszek użytkownika, możliwość ręcznego dodawania nowych fiszek, edycji istniejących i usuwania niepotrzebnych.

**Kluczowe informacje do wyświetlenia**:
- Tabela z fiszkami: [Przód | Tył | Źródło | Akcje]
- Pasek akcji na górze: przycisk "+ Nowa fiszka", dropdown sortowania, dropdown filtrowania
- Paginacja na dole: Poprzednia/Następna, informacja "Strona X z Y"
- Źródło fiszki: "AI" (pełne), "AI (edytowane)", "Ręczne"

**Kluczowe komponenty widoku**:
- `FlashcardsList.tsx` - Główny komponent widoku
- `FlashcardsTable.tsx` - Tabela z fiszkami
- `FlashcardFilters.tsx` - Kontrolki sortowania i filtrowania
- `FlashcardModal.tsx` - Modal tworzenia/edycji fiszki
- `DeleteConfirmDialog.tsx` - Potwierdzenie usunięcia
- Shadcn/ui: `Table`, `Button`, `Dialog`, `AlertDialog`, `Select`, `Textarea`

**Opcje sortowania**:
- Najnowsze (domyślnie)
- Najstarsze
- A-Z (alfabetycznie po przodzie)

**Opcje filtrowania**:
- Wszystkie (domyślnie)
- Tylko AI (ai-full + ai-edited)
- Tylko ręczne

**Modal tworzenia/edycji fiszki**:
- Textarea "Przód fiszki" (max 200 znaków + licznik)
- Textarea "Tył fiszki" (max 500 znaków + licznik)
- Przyciski: "Zapisz", "Anuluj"

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Szybkie przewijanie i filtrowanie dużych kolekcji
  - Tooltips na ikonach akcji
  - Przyciski edycji/usuwania wyraźnie oznaczone
  - Natychmiastowy feedback po akcjach (toast)
- **Dostępność**: 
  - Tabela semantyczna z odpowiednimi nagłówkami
  - ARIA labels dla ikon akcji
  - Keyboard navigation dla wszystkich kontrolek
  - Focus trap w modalu
- **Bezpieczeństwo**: 
  - Weryfikacja ownership po stronie API
  - Potwierdzenie przed trwałym usunięciem
  - Walidacja długości pól

**Integracja z API**:
- `GET /api/flashcards?page=X&limit=20&sort=created_at&order=desc&source=all` - lista fiszek
- `POST /api/flashcards` - tworzenie ręcznej fiszki
- `PATCH /api/flashcards/{id}` - edycja fiszki
- `DELETE /api/flashcards/{id}` - usunięcie fiszki

**Stany i przypadki brzegowe**:
- **Loading**: Tekst "Ładowanie..." w obszarze tabeli
- **Pusta lista**: Komunikat "Nie masz jeszcze żadnych fiszek" + CTA "Wygeneruj fiszki" lub "Dodaj ręcznie"
- **Błąd walidacji**: Toast z komunikatem o błędnych danych
- **Sukces zapisu/edycji**: Toast "Fiszka zapisana"
- **Sukces usunięcia**: Toast "Fiszka usunięta"
- **Błąd 404**: Toast "Fiszka nie została znaleziona"
- **Ostatnia strona**: Przycisk "Następna" disabled

---

### 2.4 Widok: Sesja nauki

**Ścieżka**: `/study`

**Główny cel**: Zapewnienie immersyjnego środowiska do nauki fiszek z wykorzystaniem algorytmu spaced repetition.

**Kluczowe informacje do wyświetlenia**:
- Przód fiszki (duży, centralny tekst)
- Po kliknięciu "Pokaż odpowiedź": tył fiszki
- Pasek postępu: "Fiszka X z Y"
- Przyciski samooceny: "Trudne", "Średnie", "Łatwe"
- Przycisk wyjścia (X) w prawym górnym rogu

**Kluczowe komponenty widoku**:
- `StudySession.tsx` - Główny komponent sesji
- `FlashcardDisplay.tsx` - Wyświetlanie pojedynczej fiszki
- Shadcn/ui: `Card`, `Button`, `Progress`

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Tryb pełnoekranowy bez rozpraszaczy (brak sidebaru)
  - Duża, czytelna czcionka
  - Płynne animacje przejść między fiszkami
  - Ekran końcowy: "Sesja ukończona! Przejrzałeś X fiszek"
  - Możliwość wyjścia w dowolnym momencie
- **Dostępność**: 
  - Skróty klawiaturowe (Spacja - pokaż odpowiedź, 1/2/3 - ocena)
  - Duży kontrast tekstu
  - Focus indicators na przyciskach
  - Screen reader announcements dla zmiany fiszek
- **Bezpieczeństwo**: 
  - Zapisywanie stanu algorytmu lokalnie (localStorage)
  - Brak wysyłania ocen do API w MVP (przyszła funkcja)

**Integracja z API**:
- `GET /api/flashcards` - pobranie wszystkich fiszek użytkownika
- Lokalny algorytm (ts-fsrs) decyduje o kolejności i czasie pokazywania
- Stan algorytmu zapisywany w localStorage

**Algorytm działania**:
1. Pobranie wszystkich fiszek użytkownika
2. Inicjalizacja algorytmu spaced repetition
3. Algorytm wybiera pierwszą fiszkę
4. Wyświetlenie przodu → użytkownik klika "Pokaż odpowiedź"
5. Wyświetlenie tyłu + przyciski oceny
6. Użytkownik ocenia trudność
7. Algorytm aktualizuje metadata fiszki (next review date, ease factor)
8. Przejście do kolejnej fiszki lub zakończenie sesji

**Stany i przypadki brzegowe**:
- **Brak fiszek**: Komunikat "Nie masz jeszcze fiszek do nauki" + link do generowania
- **Wszystkie fiszki przejrzane dzisiaj**: "Wszystkie fiszki przejrzane! Wróć jutro"
- **Przerwanie sesji**: Potwierdzenie "Czy na pewno chcesz przerwać sesję?"
- **Błąd ładowania**: Modal z możliwością retry

---

### 2.5 Widok: Historia generowania

**Ścieżka**: `/history`

**Główny cel**: Prezentacja statystyk generowania fiszek przez AI, analiza skuteczności akceptacji propozycji.

**Kluczowe informacje do wyświetlenia**:

**Sekcja podsumowania (karty na górze)**:
- "Łączna liczba generowań: X"
- "Średni wskaźnik akceptacji: Y%"

**Tabela historii**:
- Kolumny: [Data | Model AI | Wygenerowane | Zaakceptowane | Wskaźnik akceptacji %]
- Sortowanie: po dacie (najnowsze najpierw, domyślnie)
- Paginacja: 20/stronę

**Kluczowe komponenty widoku**:
- `GenerationsHistory.tsx` - Główny komponent widoku
- `StatsSummary.tsx` - Karty z podsumowaniem
- `GenerationsTable.tsx` - Tabela historii
- Shadcn/ui: `Card`, `Table`

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Wyraźne wizualizacje wskaźników procentowych
  - Kolorowe oznaczenia wskaźnika akceptacji (zielony >80%, żółty 60-80%, czerwony <60%)
  - Formatowanie dat w lokalnym formacie użytkownika
- **Dostępność**: 
  - Tabela semantyczna
  - Nagłówki kolumn z możliwością sortowania
  - Alt text dla wizualizacji
- **Bezpieczeństwo**: 
  - Brak wyświetlania hash tekstu źródłowego
  - Tylko dane użytkownika (RLS w bazie)

**Integracja z API**:
- `GET /api/generations?page=X&limit=20&sort=created_at&order=desc`
- Response zawiera: data array, pagination object, statistics object

**Kalkulacja metryk**:
- Wskaźnik akceptacji = (accepted_unedited + accepted_edited) / generated_count * 100%
- Średni wskaźnik = suma wszystkich zaakceptowanych / suma wszystkich wygenerowanych * 100%

**Stany i przypadki brzegowe**:
- **Brak historii**: "Nie wygenerowałeś jeszcze żadnych fiszek" + CTA do generowania
- **Loading**: "Ładowanie historii..."
- **Błąd**: Toast z komunikatem błędu
- **Pusta strona**: Brak danych do wyświetlenia

---

### 2.6 Widok: Profil użytkownika

**Ścieżka**: `/profile`

**Główny cel**: Wyświetlanie podstawowych informacji o koncie i możliwość wylogowania.

**Kluczowe informacje do wyświetlenia**:
- Email użytkownika (read-only)
- Data utworzenia konta
- Przycisk "Wyloguj się"
- (Przyszłość: przycisk "Usuń konto", ustawienia)

**Kluczowe komponenty widoku**:
- Prosty komponent React z informacjami z Supabase Auth
- Shadcn/ui: `Card`, `Button`

**UX, dostępność i względy bezpieczeństwa**:
- **UX**: 
  - Minimalistyczny widok
  - Wyraźny przycisk wylogowania
- **Dostępność**: 
  - Wszystkie elementy dostępne z klawiatury
  - Odpowiednie labele
- **Bezpieczeństwo**: 
  - Wylogowanie czyści lokalny token
  - Przekierowanie do strony logowania
  - Przyszłość: usunięcie konta z potwierdzeniem (zgodność z RODO)

**Integracja z API**:
- Supabase Auth SDK: `getUser()`, `signOut()`
- Po wylogowaniu: czyszczenie localStorage, redirect do `/`

**Stany i przypadki brzegowe**:
- **Błąd pobierania danych**: Komunikat o błędzie z możliwością retry
- **Sukces wylogowania**: Natychmiastowe przekierowanie

---

## 3. Mapa podróży użytkownika

### 3.1 Nowy użytkownik (first-time user)

**Krok 1: Landing i rejestracja**
- Użytkownik trafia na stronę główną `/`
- Widzi formularz logowania z opcją przełączenia na rejestrację
- Klika "Zarejestruj się"
- Wypełnia email i hasło
- Klika "Zarejestruj"

**Krok 2: Onboarding (opcjonalny)**
- Po rejestracji pojawia się modal onboardingowy z 2-3 slajdami:
  1. "Wklej tekst → Wygeneruj fiszki"
  2. "Akceptuj/Edytuj propozycje"
  3. "Rozpocznij naukę"
- Użytkownik przechodzi przez slajdy lub pomija

**Krok 3: Pierwsze generowanie**
- Automatyczne przekierowanie do `/generate`
- Sidebar widoczny z aktywnym stanem na "Generuj"
- Użytkownik wkleja tekst (np. fragment notatek)
- Klika "Generuj fiszki"
- Czeka 3-5 sekund (loading overlay)

**Krok 4: Przegląd i akceptacja propozycji**
- Widzi listę wygenerowanych propozycji w tabeli
- Zaznacza checkboxy przy fiszkach, które chce zapisać
- Opcjonalnie edytuje niektóre fiszki (klik "Edytuj")
- Klika "Zapisz wybrane fiszki"
- Widzi toast "Fiszki zapisane pomyślnie"

**Krok 5: Pierwsza sesja nauki**
- Nawiguje do "Sesja nauki" przez sidebar
- Widzi pełnoekranowy interfejs z pierwszą fiszką
- Klika "Pokaż odpowiedź"
- Ocenia swoją wiedzę (Trudne/Średnie/Łatwe)
- Przechodzi przez kilka kolejnych fiszek
- Widzi podsumowanie sesji

**Krok 6: Eksploracja innych funkcji**
- Sprawdza "Moje fiszki" - widzi zapisane fiszki
- Sprawdza "Historia" - widzi pierwsze generowanie ze statystykami
- Wraca do używania aplikacji regularnie

### 3.2 Powracający użytkownik

**Krok 1: Logowanie**
- Trafia na `/`
- Wpisuje email i hasło
- Klika "Zaloguj się"
- Automatyczne przekierowanie do `/generate`

**Krok 2: Główne ścieżki użycia**

**Ścieżka A: Generowanie nowych fiszek**
- `/generate` → wklejenie tekstu → generowanie → przegląd → zapis
- `/study` → nauka nowych fiszek

**Ścieżka B: Zarządzanie istniejącymi fiszkami**
- `/flashcards` → przeglądanie → edycja/usuwanie
- Dodawanie ręcznych fiszek

**Ścieżka C: Regularna nauka**
- `/study` → sesja nauki z algorytmem spaced repetition
- Ocenianie trudności fiszek
- Algorytm planuje kolejne powtórki

**Ścieżka D: Analiza postępów**
- `/history` → sprawdzanie statystyk generowania
- Analiza wskaźnika akceptacji fiszek AI

### 3.3 Przepływy między widokami

```
[Logowanie /] 
    ↓
[Generuj /generate] ←→ [Moje fiszki /flashcards]
    ↓                           ↓
[Sesja nauki /study] ←──────────┘
    ↑
    │
[Historia /history]
    ↑
    │
[Profil /profile] → [Wyloguj] → [Logowanie /]
```

**Nawigacja**:
- Sidebar dostępny we wszystkich widokach (poza sesją nauki i stroną logowania)
- Aktywny stan podświetla bieżący widok
- Kliknięcie w element sidebaru przenosi do odpowiedniego widoku
- Sesja nauki: pełnoekranowy tryb, wyjście przez przycisk X

---

## 4. Układ i struktura nawigacji

### 4.1 Sidebar - Główna nawigacja

**Typ**: Collapsible sidebar (rozwijany/zwijany)

**Pozycja**: Lewa strona ekranu

**Elementy menu**:
1. 🎯 Generuj (`/generate`)
2. 📚 Moje fiszki (`/flashcards`)
3. 🎓 Sesja nauki (`/study`)
4. 📊 Historia (`/history`)
5. 👤 Profil (`/profile`)

**Stany**:
- **Expanded (rozwinięty)**: Ikona + tekst, szerokość 256px
- **Collapsed (zwinięty)**: Tylko ikona, szerokość 64px
- **Mobile**: Overlay z backdrop, hamburger menu trigger

**Interakcje**:
- Toggle button w górnym rogu (ikona ≡)
- Klik na element menu → nawigacja do widoku
- Aktywny element: accent background + pogrubiony tekst
- Hover: subtle background change

**Responsywność**:
- **Desktop (≥768px)**: Widoczny domyślnie, możliwość zwinięcia
- **Mobile (<768px)**: Ukryty domyślnie, overlay po kliknięciu hamburger menu

**Komponenty**:
```
┌─────────────────────────────────────┐
│  [Logo 10x-Cards]          [≡]      │ ← Header z toggle
├─────────────────────────────────────┤
│  🎯  Generuj                        │ ← Link aktywny
│  📚  Moje fiszki                    │
│  🎓  Sesja nauki                    │
│  📊  Historia                       │
│  👤  Profil                         │
├─────────────────────────────────────┤
│  [Stopka - opcjonalnie]             │
└─────────────────────────────────────┘
```

### 4.2 Layout główny

**Struktura**:
- `Layout.astro` - wrapper dla wszystkich widoków (oprócz logowania i sesji nauki)
- Sidebar po lewej
- Content area po prawej
- Pełna wysokość viewportu

**Kod konceptualny**:
```
<Layout>
  <Sidebar /> ← Nawigacja
  <MainContent>
    <slot /> ← Treść widoku
  </MainContent>
</Layout>
```

### 4.3 Routing i ochrona ścieżek

**Publiczne ścieżki**:
- `/` - Logowanie/Rejestracja

**Chronione ścieżki** (wymagają autentykacji):
- `/generate` - Generowanie fiszek
- `/flashcards` - Moje fiszki
- `/study` - Sesja nauki
- `/history` - Historia
- `/profile` - Profil

**Middleware**:
- Sprawdzanie tokenu JWT dla chronionych ścieżek
- Przekierowanie do `/` jeśli brak tokenu
- Przekierowanie do `/generate` jeśli zalogowany trafia na `/`

### 4.4 Nawigacja kontekstowa

**Breadcrumbs**: Nie używane (flat structure)

**Back button**: Nie potrzebny (sidebar zawsze dostępny)

**Deep linking**: Każdy widok ma unikalny URL, można bookmarkować

**Search**: Nie w MVP (do dodania w przyszłości w `/flashcards`)

---

## 5. Kluczowe komponenty

### 5.1 Komponenty layoutu

#### Sidebar.tsx
**Cel**: Główna nawigacja aplikacji

**Właściwości**:
- Rozwijany/zwijany stan
- Aktywny element highlightowany
- Responsywny (overlay na mobile)

**Wykorzystywane w**: Wszystkie widoki oprócz `/` i `/study`

---

#### Layout.astro
**Cel**: Wrapper dla stron z sidebaremem

**Właściwości**:
- Zawiera Sidebar i content area
- Zarządza autentykacją context
- Responsive grid layout

**Wykorzystywane w**: `/generate`, `/flashcards`, `/study` (częściowo), `/history`, `/profile`

---

### 5.2 Komponenty autentykacji

#### AuthForm.tsx
**Cel**: Formularz logowania i rejestracji

**Właściwości**:
- Toggle między trybami (login/register)
- Walidacja inline
- Obsługa błędów
- Integracja z Supabase Auth

**Wykorzystywane w**: `/`

**Wewnętrzne komponenty**: Input (email), Input (password), Button (submit)

---

### 5.3 Komponenty generowania

#### TextInput.tsx
**Cel**: Textarea z walidacją dla tekstu źródłowego

**Właściwości**:
- Licznik znaków z kolorowaniem (1000-10000)
- Walidacja real-time
- Max length enforcement

**Wykorzystywane w**: `/generate`

---

#### ProposalsList.tsx
**Cel**: Tabela z wygenerowanymi propozycjami fiszek

**Właściwości**:
- Checkbox selection
- Inline editing mode
- Licznik wybranych fiszek

**Wykorzystywane w**: `/generate`

**Wewnętrzne komponenty**: Table, ProposalRow

---

#### ProposalRow.tsx
**Cel**: Pojedynczy wiersz propozycji z możliwością edycji

**Właściwości**:
- Tryb podglądu i edycji
- Textarea dla front/back
- Save/Cancel buttons w trybie edycji

**Wykorzystywane w**: ProposalsList.tsx

---

### 5.4 Komponenty zarządzania fiszkami

#### FlashcardsList.tsx
**Cel**: Główny komponent widoku "Moje fiszki"

**Właściwości**:
- Zarządzanie stanem (fetching, pagination, filters)
- Integracja z API
- Otwieranie modali (create, edit, delete)

**Wykorzystywane w**: `/flashcards`

**Wewnętrzne komponenty**: FlashcardFilters, FlashcardsTable, FlashcardModal, DeleteConfirmDialog

---

#### FlashcardsTable.tsx
**Cel**: Tabela wyświetlająca fiszki

**Właściwości**:
- Kolumny: Front, Back, Source, Actions
- Action buttons: Edit, Delete
- Responsywny layout

**Wykorzystywane w**: FlashcardsList.tsx

---

#### FlashcardFilters.tsx
**Cel**: Kontrolki sortowania i filtrowania

**Właściwości**:
- Sort dropdown (Najnowsze, Najstarsze, A-Z)
- Filter dropdown (Wszystkie, AI, Ręczne)
- "+ Nowa fiszka" button

**Wykorzystywane w**: FlashcardsList.tsx

**Wewnętrzne komponenty**: Select, Button

---

#### FlashcardModal.tsx
**Cel**: Modal tworzenia/edycji fiszki

**Właściwości**:
- Tryb create vs edit
- Textarea z licznikiem (front: 200, back: 500)
- Walidacja
- Save/Cancel buttons

**Wykorzystywane w**: FlashcardsList.tsx

**Wewnętrzne komponenty**: Dialog, Textarea, Button

---

#### DeleteConfirmDialog.tsx
**Cel**: Potwierdzenie usunięcia fiszki

**Właściwości**:
- Komunikat potwierdzenia
- Cancel/Delete buttons
- Destructive styling dla Delete

**Wykorzystywane w**: FlashcardsList.tsx

**Wewnętrzne komponenty**: AlertDialog

---

### 5.5 Komponenty sesji nauki

#### StudySession.tsx
**Cel**: Główny komponent sesji nauki

**Właściwości**:
- Zarządzanie stanem sesji
- Integracja z algorytmem spaced repetition
- Progress tracking
- Pełnoekranowy layout

**Wykorzystywane w**: `/study`

**Wewnętrzne komponenty**: FlashcardDisplay, Progress, Button

---

#### FlashcardDisplay.tsx
**Cel**: Wyświetlanie pojedynczej fiszki w sesji nauki

**Właściwości**:
- Stan: front only vs front+back
- "Pokaż odpowiedź" button
- Assessment buttons (Trudne, Średnie, Łatwe)
- Duża czcionka, centered layout

**Wykorzystywane w**: StudySession.tsx

---

### 5.6 Komponenty historii

#### GenerationsHistory.tsx
**Cel**: Główny komponent widoku historii

**Właściwości**:
- Fetching danych z API
- Zarządzanie paginacją
- Wyświetlanie summary + table

**Wykorzystywane w**: `/history`

**Wewnętrzne komponenty**: StatsSummary, GenerationsTable

---

#### StatsSummary.tsx
**Cel**: Karty z podsumowaniem statystyk

**Właściwości**:
- Karta: Łączna liczba generowań
- Karta: Średni wskaźnik akceptacji
- Layout poziomy (flex row)

**Wykorzystywane w**: GenerationsHistory.tsx

**Wewnętrzne komponenty**: Card

---

#### GenerationsTable.tsx
**Cel**: Tabela historii generowania

**Właściwości**:
- Kolumny: Data, Model, Wygenerowane, Zaakceptowane, Wskaźnik
- Formatowanie dat i procentów
- Kolorowanie wskaźników

**Wykorzystywane w**: GenerationsHistory.tsx

**Wewnętrzne komponenty**: Table

---

### 5.7 Komponenty Shadcn/ui (wykorzystywane)

#### Komponenty formularzy
- **Button** - Wszystkie akcje klikalne (submit, cancel, action buttons)
- **Input** - Email, hasło
- **Textarea** - Wieloliniowy tekst (front/back fiszki, tekst źródłowy)
- **Checkbox** - Selekcja propozycji fiszek
- **Select** - Dropdowny (sortowanie, filtrowanie)

#### Komponenty layoutu
- **Card** - Wyświetlanie fiszek, karty statystyk
- **Table** - Listy fiszek, propozycji, historii

#### Komponenty overlay
- **Dialog** - Modal tworzenia/edycji fiszki, onboarding
- **AlertDialog** - Potwierdzenia usunięcia, błędy krytyczne
- **Toast** - Komunikaty sukcesu, błędy nie-krytyczne

#### Komponenty feedback
- **Progress** - Pasek postępu w sesji nauki
- **Spinner** - Loading states (może wymagać custom lub lucide-react icon)

---

### 5.8 Komponenty pomocnicze

#### ErrorBoundary (opcjonalny)
**Cel**: Graceful error handling dla błędów React

**Właściwości**:
- Catch errors w drzewie komponentów
- Wyświetlanie fallback UI
- Logging błędów

---

#### LoadingSpinner
**Cel**: Reużywalny spinner do loading states

**Właściwości**:
- Różne rozmiary (small, medium, large)
- Opcjonalny tekst (np. "Ładowanie...")

---

#### Toast System
**Cel**: Globalna obsługa notyfikacji

**Właściwości**:
- Success, error, info, warning variants
- Auto-dismiss po X sekundach
- Position: top-right (lub konfigurowalny)

**Wykorzystywane w**: Wszystkie widoki dla feedback

---

## 6. Szczegóły interakcji i stanów

### 6.1 Zarządzanie stanem aplikacji

**Strategia**: Local Component State (bez global state management)

**Uzasadnienie**:
- MVP nie wymaga złożonego global state
- Większość danych jest specyficzna dla widoku
- Refetching po mutacjach jest akceptowalny performance-wise
- Unikanie overhead'u Redux/Zustand

**Implementacja per typ danych**:

1. **Stan autentykacji**
   - Zarządzany przez Supabase Auth SDK
   - Dostęp przez `supabase.auth.getSession()`
   - Udostępniany przez Context API jeśli potrzebny w wielu komponentach

2. **Stan widoków**
   - Każdy widok zarządza własnymi danymi
   - Fetch on mount, refetch po zmianach
   - Lokalne flagi loading/error

3. **Stan edycji propozycji**
   - Array propozycji w local state
   - Tracking zaznaczonych propozycji (checkbox state)
   - Tracking edytowanych wartości (controlled inputs)
   - Czyszczenie po zapisie

4. **Stan sesji nauki**
   - Current card index
   - Cards queue z algorytmu
   - Algorithm internal state (review dates, ease factors)
   - Persistence w localStorage

---

### 6.2 Obsługa błędów

**Strategia dwupoziomowa**:

**Poziom 1: Błędy krytyczne (Modal)**
- 401 Unauthorized → "Sesja wygasła" + przycisk "Zaloguj się ponownie"
- 500 Internal Server Error → "Wystąpił błąd" + przyciski "Spróbuj ponownie"/"Kontakt"
- Network errors (nie 4xx/5xx) → "Problem z połączeniem" + przycisk "Spróbuj ponownie"

**Poziom 2: Błędy nie-krytyczne (Toast)**
- 400 Bad Request → Toast z komunikatem API
- 404 Not Found → Toast "Nie znaleziono zasobu"
- 429 Too Many Requests → Toast "Przekroczony limit (10/godz). Spróbuj za X minut"
- Success → Toast "Operacja zakończona sukcesem"

**Komponenty**:
- AlertDialog (Shadcn/ui) dla krytycznych
- Toast (Shadcn/ui) dla nie-krytycznych

**Przykład obsługi**:
```typescript
// Pseudokod
try {
  const response = await fetch('/api/flashcards', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 401) {
      showAuthModal(); // Modal
    } else if (response.status >= 400 && response.status < 500) {
      showToast(error.message); // Toast
    } else {
      showErrorModal(error.message); // Modal
    }
    return;
  }
  
  const data = await response.json();
  setState(data);
} catch (e) {
  showToast('Problem z połączeniem. Spróbuj ponownie.');
}
```

---

### 6.3 Loading states

**Typy loading states**:

1. **Generowanie AI** (3-5 sekund)
   - Full screen overlay z spinnerem
   - Tekst: "Generuję fiszki..."
   - Disable wszystkich kontrolek

2. **Button actions** (< 1 sekunda)
   - Button disabled
   - Inline spinner icon w button
   - Przykład: "Zapisywanie..."

3. **List loading** (< 500ms)
   - Prosty tekst "Ładowanie..." w content area
   - Opcjonalnie: skeleton screens (nice-to-have, nie MVP)

4. **Initial page load**
   - Astro static HTML → szybki first paint
   - React hydration → płynne

---

### 6.4 Responsywność

**Breakpoints (Tailwind)**:
- Mobile: < 768px
- Desktop: ≥ 768px

**Responsive patterns**:

**Sidebar**:
- Mobile: ukryty domyślnie, overlay po kliknięciu hamburger
- Desktop: widoczny, collapsible do icon-only

**Tables**:
- Mobile: rozważenie card layout (opcjonalnie w MVP, można pozostawić scrollable table)
- Desktop: pełny table layout

**Forms**:
- Stack vertically na wszystkich rozdzielczościach
- Full-width inputs na mobile
- Constrained width na desktop (max-w-xl)

**Modals**:
- Near full-screen na mobile
- Centered z max-width na desktop

**Study Session**:
- Full-page na wszystkich urządzeniach
- Adjust font size dla czytelności

---

### 6.5 Dostępność (a11y)

**Keyboard navigation**:
- Wszystkie elementy interaktywne dostępne przez Tab
- Focus visible indicators (Tailwind: `focus:ring-2`)
- Modal focus trap (Shadcn/ui Dialog obsługuje)
- Escape zamyka modale

**Screen reader support**:
- Semantic HTML (nav, main, aside, article)
- ARIA labels dla icon-only buttons
- ARIA live regions dla toast notifications
- Alt text dla obrazków (logo)

**Color i contrast**:
- WCAG AA minimum contrast ratios
- Nie poleganie wyłącznie na kolorze (ikony + tekst)
- Character counter: kolor + tekst opisowy

**Form accessibility**:
- Label elements powiązane z inputs
- Error messages announced to screen readers
- Required fields: asterisk + aria-required

---

### 6.6 Bezpieczeństwo

**Authentication**:
- JWT tokens zarządzane przez Supabase (preferowane httpOnly cookies)
- Token refresh automatyczny przez Supabase SDK
- Nigdy nie przechowywanie sensitywnych danych w localStorage

**Authorization**:
- Wszystkie API endpoints walidują JWT
- User ID ekstraktowany z tokenu (nigdy z request body)
- Row-Level Security (RLS) w bazie jako drugi layer

**XSS Prevention**:
- React escapes JSX content domyślnie
- Unikanie `dangerouslySetInnerHTML`
- Sanityzacja user-generated content

**CSRF Protection**:
- Supabase Auth zapewnia CSRF protection
- SameSite cookie attribute

**Input Validation**:
- Client-side dla UX
- Server-side jako source of truth
- Character limits enforced po obu stronach

**HTTPS Only**:
- Cały production traffic przez HTTPS
- Secure flag na cookies

**Rate Limiting**:
- API enforces 10 generations/hour
- UI wyświetla odpowiednie błędy
- Brak możliwości bypass po stronie klienta

---

## 7. Mapowanie wymagań na elementy UI

### 7.1 Wymagania funkcjonalne → UI

| Wymaganie z PRD | Element UI | Widok | Komponenty |
|-----------------|-----------|-------|------------|
| **1. Automatyczne generowanie fiszek** | Textarea + przycisk generuj → tabela propozycji | `/generate` | TextInput, ProposalsList |
| **2. Ręczne tworzenie fiszek** | Modal z formularzem (przód/tył) | `/flashcards` | FlashcardModal |
| **3. Edycja fiszek** | Inline edit w tabeli lub modal | `/flashcards`, `/generate` | FlashcardModal, ProposalRow |
| **4. Usuwanie fiszek** | Przycisk delete + confirmation dialog | `/flashcards` | DeleteConfirmDialog |
| **5. Rejestracja i logowanie** | Formularz z przełącznikiem | `/` | AuthForm |
| **6. Integracja z algorytmem powtórek** | Sesja nauki z oceną trudności | `/study` | StudySession, FlashcardDisplay |
| **7. Statystyki generowania** | Tabela historii + karty podsumowania | `/history` | GenerationsHistory, StatsSummary |

---

### 7.2 Historyjki użytkownika → UI Flow

**US-001: Rejestracja konta**
- **UI Flow**: `/` → formularz rejestracji → wypełnienie email/hasło → klik "Zarejestruj" → walidacja → sukces → redirect do `/generate`
- **Elementy**: AuthForm (rejestracja mode), Input (email), Input (password), Button (submit)

**US-002: Logowanie**
- **UI Flow**: `/` → formularz logowania → wypełnienie email/hasło → klik "Zaloguj" → walidacja → sukces → redirect do `/generate`
- **Elementy**: AuthForm (login mode), Input (email), Input (password), Button (submit)

**US-003: Generowanie fiszek przy użyciu AI**
- **UI Flow**: `/generate` → wklej tekst (1000-10000 znaków) → licznik znaków z walidacją → klik "Generuj" → loading overlay (3-5s) → wyświetlenie propozycji
- **Elementy**: TextInput (textarea + counter), Button (generuj), Loading overlay, ProposalsList

**US-004: Przegląd i zatwierdzanie propozycji**
- **UI Flow**: Propozycje w tabeli → checkbox przy każdej → opcjonalna edycja inline → zaznaczenie wybranych → klik "Zapisz wybrane" → toast sukcesu
- **Elementy**: ProposalsList (table), Checkbox, ProposalRow (inline edit), Button (zapisz)

**US-005: Edycja fiszek**
- **UI Flow**: `/flashcards` → lista fiszek → klik "Edytuj" przy fiszce → modal z wartościami → modyfikacja → klik "Zapisz" → toast sukcesu → odświeżenie listy
- **Elementy**: FlashcardsTable, FlashcardModal (edit mode), Textarea (front/back), Button (zapisz)

**US-006: Usuwanie fiszek**
- **UI Flow**: `/flashcards` → lista fiszek → klik "Usuń" → confirmation dialog "Czy na pewno?" → klik "Usuń" → toast sukcesu → odświeżenie listy
- **Elementy**: FlashcardsTable, DeleteConfirmDialog, AlertDialog

**US-007: Ręczne tworzenie fiszek**
- **UI Flow**: `/flashcards` → klik "+ Nowa fiszka" → modal → wypełnienie przód/tył → klik "Zapisz" → toast sukcesu → odświeżenie listy
- **Elementy**: Button (nowa fiszka), FlashcardModal (create mode), Textarea (front/back)

**US-008: Sesja nauki z algorytmem powtórek**
- **UI Flow**: `/study` → algorytm wybiera fiszki → wyświetlenie przodu → klik "Pokaż odpowiedź" → wyświetlenie tyłu + przyciski oceny → klik "Średnie" → następna fiszka lub koniec sesji
- **Elementy**: StudySession, FlashcardDisplay, Button (pokaż odpowiedź), Button group (ocena)

**US-009: Bezpieczny dostęp i autoryzacja**
- **UI Flow**: Middleware sprawdza token JWT przy każdym requeście → brak tokenu = redirect do `/` → token valid = dostęp do danych użytkownika (RLS w bazie)
- **Elementy**: Middleware (Astro), AuthContext, Protected routes

---

## 8. Przypadki brzegowe i stany błędów

### 8.1 Przypadki brzegowe per widok

**Widok: Autentykacja (`/`)**
- Email nieprawidłowy format → inline error "Nieprawidłowy adres email"
- Hasło za krótkie → inline error "Hasło musi mieć min. 8 znaków"
- Email już istnieje (rejestracja) → inline error "Konto z tym emailem już istnieje"
- Błędne hasło (logowanie) → inline error "Nieprawidłowy email lub hasło"
- Problem z siecią → toast "Nie można połączyć się z serwerem"

**Widok: Generowanie (`/generate`)**
- Tekst < 1000 znaków → licznik czerwony, button disabled, hint "Minimum 1000 znaków"
- Tekst > 10000 znaków → licznik czerwony, button disabled, hint "Maksimum 10000 znaków"
- Rate limit przekroczony (429) → toast "Przekroczony limit 10 generowań/godz. Spróbuj za X minut"
- Błąd LLM API (500) → modal "Nie udało się wygenerować fiszek" + przycisk "Spróbuj ponownie"
- Brak propozycji z AI → komunikat "AI nie wygenerowało fiszek. Spróbuj z innym tekstem"
- Niezapisane propozycje + próba opuszczenia strony → `onbeforeunload` alert

**Widok: Moje fiszki (`/flashcards`)**
- Pusta lista fiszek → komunikat "Nie masz jeszcze fiszek" + CTA "Wygeneruj fiszki" lub "Dodaj ręcznie"
- Błąd walidacji przy edycji (front > 200 lub back > 500) → toast "Tekst zbyt długi"
- Fiszka nie znaleziona (404) → toast "Fiszka została już usunięta"
- Ostatnia strona paginacji → przycisk "Następna" disabled
- Loading podczas pobierania → tekst "Ładowanie..."

**Widok: Sesja nauki (`/study`)**
- Brak fiszek → komunikat "Nie masz jeszcze fiszek do nauki" + link "Wygeneruj fiszki"
- Wszystkie fiszki przejrzane dzisiaj → "Dobra robota! Wszystkie fiszki przejrzane. Wróć jutro."
- Próba wyjścia w trakcie sesji → confirmation "Czy na pewno chcesz przerwać sesję?"
- Błąd ładowania fiszek → modal "Nie udało się załadować fiszek" + przycisk "Spróbuj ponownie"

**Widok: Historia (`/history`)**
- Brak historii generowań → komunikat "Nie wygenerowałeś jeszcze żadnych fiszek" + CTA "Wygeneruj teraz"
- Pusta strona paginacji → komunikat "Brak danych"
- Błąd ładowania → toast "Nie udało się załadować historii"

**Widok: Profil (`/profile`)**
- Błąd pobierania danych użytkownika → komunikat "Nie udało się załadować profilu" + przycisk "Spróbuj ponownie"
- Wylogowanie w trakcie → natychmiastowy redirect do `/`

---

### 8.2 Globalne stany błędów

**401 Unauthorized** (sesja wygasła)
- Modal: "Twoja sesja wygasła. Zaloguj się ponownie."
- Przycisk: "Przejdź do logowania"
- Action: czyszczenie localStorage, redirect do `/`

**500 Internal Server Error**
- Modal: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie lub skontaktuj się z pomocą techniczną."
- Przyciski: "Spróbuj ponownie" / "Kontakt"

**Network Error** (brak internetu)
- Toast: "Brak połączenia z internetem. Sprawdź swoje połączenie."
- Automatyczny retry po przywróceniu połączenia (opcjonalnie)

---

### 8.3 Scenariusze edge case

**Równoczesne edycje** (ten sam użytkownik, dwie karty przeglądarki)
- **Zachowanie**: Last write wins
- **Mitigation**: Toast "Fiszka została zaktualizowana w innej karcie"

**Usunięcie fiszki podczas sesji nauki**
- **Zachowanie**: Pominięcie usuniętej fiszki w kolejce
- **UI**: Brak komunikatu (seamless skip)

**Generowanie z tym samym tekstem wielokrotnie**
- **Zachowanie**: Dozwolone, każde generowanie to nowy rekord w historii
- **UI**: Brak komunikatu, normalne działanie

**Bardzo długie teksty w fiszkach** (edge of limits: 200/500 chars)
- **Zachowanie**: Truncation z "..." w widokach tabelarycznych
- **UI**: Full text w modalu edycji lub po hover (tooltip)

---

## 9. Zgodność architektury UI z planem API

### 9.1 Mapowanie endpointów API → UI

| Endpoint API | Metoda | Użycie w UI | Widok | Komponent |
|--------------|--------|-------------|-------|-----------|
| `/api/generations` | POST | Generowanie propozycji fiszek | `/generate` | TextInput → API call |
| `/api/generations` | GET | Lista historii generowań | `/history` | GenerationsHistory |
| `/api/flashcards` | GET | Lista fiszek użytkownika | `/flashcards`, `/study` | FlashcardsList, StudySession |
| `/api/flashcards` | POST | Tworzenie ręcznej fiszki | `/flashcards` | FlashcardModal (create) |
| `/api/flashcards/batch` | POST | Zapis zaakceptowanych propozycji | `/generate` | ProposalsList → API call |
| `/api/flashcards/{id}` | PATCH | Edycja fiszki | `/flashcards` | FlashcardModal (edit) |
| `/api/flashcards/{id}` | DELETE | Usunięcie fiszki | `/flashcards` | DeleteConfirmDialog |
| Supabase Auth | SDK | Logowanie, rejestracja, wylogowanie | `/`, `/profile` | AuthForm, Profile |

---

### 9.2 Przepływ danych: Generowanie i zapis fiszek

**Krok 1: Generowanie**
```
User: wkleja tekst do textarea
  ↓
Client: walidacja długości (1000-10000)
  ↓
Client: POST /api/generations { source_text }
  ↓
API: walidacja → call LLM → zapis generation record → return { generation: {...}, proposals: [...] }
  ↓
Client: store proposals in local state (ProposalsList)
  ↓
UI: wyświetlenie tabeli z proposals, checkboxy, inline edit
```

**Krok 2: Akceptacja propozycji**
```
User: zaznacza checkboxy, opcjonalnie edytuje propozycje, klika "Zapisz wybrane"
  ↓
Client: zbiera zaznaczone propozycje + flagi edited
  ↓
Client: POST /api/flashcards/batch { generation_id, flashcards: [{front, back, edited}, ...] }
  ↓
API: create flashcards z odpowiednim source (ai-full lub ai-edited) → update generation statistics
  ↓
Client: toast sukcesu, czyszczenie proposals state, opcjonalnie redirect do /flashcards
```

---

### 9.3 Query parameters i filtrowanie

**GET /api/flashcards**
- UI kontrolki: Sort dropdown, Filter dropdown, Pagination buttons
- Query params: `?page=1&limit=20&sort=created_at&order=desc&source=all`

**Mapowanie UI → params**:
- Sort "Najnowsze" → `sort=created_at&order=desc`
- Sort "Najstarsze" → `sort=created_at&order=asc`
- Sort "A-Z" → `sort=front&order=asc`
- Filter "Wszystkie" → `source=` (brak parametru)
- Filter "AI" → `source=ai-full,ai-edited` (lub obsługa po stronie API)
- Filter "Ręczne" → `source=manual`
- Pagination → `page=X`

**GET /api/generations**
- UI kontrolki: Pagination buttons
- Query params: `?page=1&limit=20&sort=created_at&order=desc`

---

### 9.4 Validation rules - client vs server

| Pole | Client Validation | Server Validation | UI Feedback |
|------|-------------------|-------------------|-------------|
| Email (auth) | Regex format check | Format + unique check | Inline error pod polem |
| Hasło (auth) | Min 8 znaków | Min 8 znaków + complexity | Inline error pod polem |
| Source text | 1000-10000 znaków | 1000-10000 znaków | Licznik z kolorowaniem + disabled button |
| Front (flashcard) | 1-200 znaków | 1-200 znaków | Licznik + inline error |
| Back (flashcard) | 1-500 znaków | 1-500 znaków | Licznik + inline error |

**Zasada**: Client validation dla UX, Server validation jako source of truth

---

### 9.5 Error responses → UI handling

| Status | Error Type | API Response | UI Action |
|--------|-----------|--------------|-----------|
| 400 | Bad Request | `{ error, message, details }` | Toast z message |
| 401 | Unauthorized | `{ error, message }` | Modal "Sesja wygasła" + logout |
| 404 | Not Found | `{ error, message }` | Toast z message |
| 429 | Rate Limit | `{ error, message, retry_after }` | Toast "Limit przekroczony, spróbuj za X min" |
| 500 | Server Error | `{ error, message, request_id }` | Modal "Błąd serwera" + retry button |
| Network | Connection | (no response) | Toast "Problem z połączeniem" |

---

## 10. Punkty bólu użytkownika i rozwiązania UI

### 10.1 Problem: Tworzenie fiszek jest czasochłonne

**Rozwiązanie UI**:
- Automatyczne generowanie przez AI z jednego kliknięcia
- Textarea przyjmuje duże ilości tekstu (do 10000 znaków)
- Batch acceptance - zaznaczenie i zapis wielu fiszek naraz
- Inline editing propozycji bez otwierania modali

**Elementy**:
- `/generate` - główny widok, najważniejszy w nawigacji (pierwszy)
- Licznik znaków z wizualnym feedbackiem dla optymalnej długości
- Tabela propozycji z prostym flow: zaznacz → edytuj (opcjonalnie) → zapisz

---

### 10.2 Problem: Trudność w regularnej nauce (spaced repetition)

**Rozwiązanie UI**:
- Dedykowany widok "Sesja nauki" z immersyjnym interfejsem
- Algorytm automatycznie wybiera fiszki do powtórki
- Minimalistyczny design - brak rozpraszaczy
- Proste przyciski oceny (Trudne/Średnie/Łatwe)
- Progress bar pokazuje postęp

**Elementy**:
- `/study` - pełnoekranowy tryb
- Duża czcionka dla łatwego czytania
- Wyraźne przyciski akcji
- Ekran końcowy z podsumowaniem sesji

---

### 10.3 Problem: Brak kontroli nad wygenerowanymi fiszkami

**Rozwiązanie UI**:
- Każda propozycja z checkboxem - użytkownik decyduje co zaakceptować
- Możliwość inline edycji przed zapisem
- Możliwość odrzucenia propozycji (po prostu nie zaznaczać)
- Pełna edycja po zapisie w `/flashcards`

**Elementy**:
- Checkboxy przy każdej propozycji
- Przycisk "Edytuj" w każdym wierszu
- Counter "Wybrane: X/Y" dla świadomości

---

### 10.4 Problem: Brak świadomości skuteczności AI

**Rozwiązanie UI**:
- Dedykowany widok `/history` ze statystykami
- Wskaźnik akceptacji per generowanie i średni
- Przejrzysta tabela z historią
- Kolorowe oznaczenia dla łatwej interpretacji (zielony/żółty/czerwony)

**Elementy**:
- StatsSummary - karty z kluczowymi metrykami
- GenerationsTable - szczegółowa historia
- Formatowanie procentowe dla czytelności

---

### 10.5 Problem: Zgubienie się w interfejsie

**Rozwiązanie UI**:
- Sidebar zawsze widoczny (desktop) z aktywnym stanem
- Flat structure - wszystkie widoki dostępne z jednego poziomu
- Breadcrumbs niepotrzebne - każdy widok ma jasny cel
- Spójny layout i komponenty (Shadcn/ui)

**Elementy**:
- Sidebar z ikonami i tekstem
- Aktywny element podświetlony
- Logo w sidebarze jako "home" button

---

### 10.6 Problem: Frustracja podczas błędów

**Rozwiązanie UI**:
- Wyraźne komunikaty błędów w języku polskim
- Podział na krytyczne (modal) i nie-krytyczne (toast)
- Zawsze opcja retry lub alternatywna akcja
- Walidacja inline zapobiega błędom przed submitem

**Elementy**:
- AlertDialog dla błędów wymagających uwagi
- Toast dla szybkich notyfikacji
- Inline validation dla formularzy
- Loading states zapobiegają frustracji "czy coś się dzieje?"

---

## 11. Metryki sukcesu UI (post-MVP)

Choć nie są bezpośrednio implementowane w MVP, architektura UI wspiera przyszły tracking następujących metryk:

### 11.1 Metryki engagement

- **Liczba generowań per użytkownik** → tracking w `/history`
- **Wskaźnik akceptacji propozycji AI** → widoczny w `/history`, cel >75%
- **Liczba sesji nauki per użytkownik** → przyszły tracking w `/study`
- **Liczba ręcznie dodanych fiszek** → tracking w `/flashcards` (source=manual)

### 11.2 Metryki UX

- **Time to first flashcard** → od rejestracji do pierwszej zapisanej fiszki
- **Completion rate** generowania → ile użytkowników kończy flow generuj→zapisz
- **Error rate** → częstotliwość błędów API w relacji do akcji użytkownika
- **Bounce rate** z poszczególnych widoków

### 11.3 Metryki wydajności

- **Time to Interactive (TTI)** → Astro + React islands
- **API response times** → szczególnie `/api/generations` (cel <5s)
- **Page load times** → cel <2s dla wszystkich widoków

---

## 12. Roadmap rozwoju UI (post-MVP)

### Faza 2: Rozszerzenia funkcjonalności
- Wyszukiwanie fiszek (search bar w `/flashcards`)
- Tagi i kategorie fiszek
- Export fiszek (Anki, CSV)
- Zaawansowane filtrowanie i sortowanie
- Bulk operations (delete multiple, edit multiple)

### Faza 3: Personalizacja
- Motywy kolorystyczne (light/dark mode)
- Konfiguracja algorytmu powtórek
- Ustawienia sesji nauki (długość sesji, liczba fiszek)
- Customowe modele AI do generowania

### Faza 4: Społeczność
- Udostępnianie zestawów fiszek
- Publiczne kolekcje
- System komentarzy i ocen
- Profile publiczne użytkowników

### Faza 5: Mobilne doświadczenie
- Progressive Web App (PWA)
- Offline mode
- Native mobile apps (iOS, Android)
- Push notifications dla powtórek

---

## 13. Podsumowanie

### 13.1 Kluczowe decyzje architektoniczne

1. **Prostota jako priorytet** - maksymalne wykorzystanie Shadcn/ui, minimalne custom components
2. **Sidebar navigation** - zawsze dostępna, intuicyjna nawigacja
3. **Local state management** - bez globalnego state, refetching po mutacjach
4. **Dwupoziomowa obsługa błędów** - modals dla krytycznych, toasts dla reszty
5. **Responsywność mobile-first** - overlay sidebar, adaptive layouts
6. **Dostępność od podstaw** - semantic HTML, ARIA labels, keyboard navigation

### 13.2 Silne strony architektury

- **Szybka implementacja** - gotowe komponenty, jasna struktura
- **Spójna UX** - Shadcn/ui zapewnia jednolity wygląd
- **Skalowalność** - łatwe dodanie nowych widoków i funkcji
- **Bezpieczeństwo** - Supabase Auth + RLS w bazie + walidacja
- **Wydajność** - Astro static generation + React islands

### 13.3 Gotowość do implementacji

Architektura jest kompletna i gotowa do implementacji:
- ✅ Wszystkie widoki zdefiniowane
- ✅ Komponenty wymienione i opisane
- ✅ Przepływy użytkownika zmapowane
- ✅ Integracja z API zaplanowana
- ✅ Przypadki brzegowe uwzględnione
- ✅ Bezpieczeństwo i dostępność zaadresowane

### 13.4 Kolejne kroki

1. Setup projektu: Astro + Shadcn/ui
2. Implementacja layoutu i nawigacji
3. Implementacja autentykacji
4. Implementacja widoków według priorytetu: Generate → Flashcards → Study → History → Profile
5. Testing i polish
6. Deployment

---

**Wersja dokumentu**: 1.0  
**Data**: 2026-01-31  
**Status**: Gotowe do implementacji  
**Autor**: AI Architecture Assistant
