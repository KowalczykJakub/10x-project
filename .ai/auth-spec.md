# Specyfikacja Techniczna - System Autentykacji 10x-Cards

## 1. WPROWADZENIE

### 1.1 Cel dokumentu
Niniejsza specyfikacja definiuje architekturę i implementację modułu autentykacji użytkowników dla aplikacji 10x-Cards, obejmującą rejestrację, logowanie, wylogowanie oraz odzyskiwanie hasła.

### 1.2 Zakres funkcjonalny
Specyfikacja realizuje wymagania ze zdefiniowanych historyjek użytkownika:
- **US-001**: Rejestracja konta użytkownika
- **US-002**: Logowanie do aplikacji
- **US-010**: Wylogowanie z systemu
- **US-011**: Odzyskiwanie hasła

### 1.3 Stack technologiczny
- **Frontend**: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend**: Astro API Routes (Node.js adapter, standalone mode)
- **Baza danych i Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Rendering**: Server-side rendering (SSR) z hybrydowym renderowaniem

### 1.4 Założenia projektowe
- Dane użytkowników są prywatne - każdy użytkownik widzi tylko swoje zasoby
- Wszystkie chronione widoki wymagają uwierzytelnienia
- System wykorzystuje Supabase Auth jako dostawcę uwierzytelniania
- Sesje użytkowników są zarządzane przez Supabase (JWT tokens + refresh tokens)
- Aplikacja działa w trybie SSR z możliwością ochrony stron na poziomie middleware

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Struktura stron i komponentów

#### 2.1.1 Strony publiczne (dostępne bez uwierzytelnienia)
Lokalizacja: `src/pages/`

##### `/login` - Strona logowania
**Plik**: `src/pages/login.astro`

**Opis**: Strona zawierająca formularz logowania użytkownika.

**Struktura**:
```
login.astro
├── Layout: Layout.astro (publiczny layout bez Sidebar)
└── Komponent: LoginForm (React, client:load)
```

**Cechy**:
- Renderowana server-side przez Astro
- Dostępna dla wszystkich użytkowników (w tym zalogowanych)
- Zalogowani użytkownicy są przekierowywani do `/generate`
- Brak Sidebar - korzysta z prostego `Layout.astro`

---

##### `/register` - Strona rejestracji
**Plik**: `src/pages/register.astro`

**Opis**: Strona zawierająca formularz rejestracji nowego użytkownika.

**Struktura**:
```
register.astro
├── Layout: Layout.astro (publiczny layout bez Sidebar)
└── Komponent: RegisterForm (React, client:load)
```

**Cechy**:
- Renderowana server-side przez Astro
- Dostępna dla wszystkich użytkowników
- Zalogowani użytkownicy są przekierowywani do `/generate`
- Po rejestracji użytkownik może wymagać weryfikacji email (zależnie od konfiguracji Supabase)

---

##### `/forgot-password` - Strona resetowania hasła
**Plik**: `src/pages/forgot-password.astro`

**Opis**: Strona umożliwiająca zainicjowanie procesu resetowania hasła.

**Struktura**:
```
forgot-password.astro
├── Layout: Layout.astro (publiczny layout bez Sidebar)
└── Komponent: ForgotPasswordForm (React, client:load)
```

**Cechy**:
- Renderowana server-side przez Astro
- Dostępna dla wszystkich użytkowników
- Użytkownik podaje email, na który zostanie wysłany link resetujący

---

##### `/reset-password` - Strona ustawiania nowego hasła
**Plik**: `src/pages/reset-password.astro`

**Opis**: Strona wyświetlana po kliknięciu w link z emaila resetującego hasło.

**Struktura**:
```
reset-password.astro
├── Layout: Layout.astro (publiczny layout bez Sidebar)
└── Komponent: ResetPasswordForm (React, client:load)
```

**Cechy**:
- Renderowana server-side przez Astro
- Wymaga tokenu z URL (przekazywanego przez Supabase)
- Użytkownik ustawia nowe hasło
- Po pomyślnej zmianie przekierowanie do `/login`

---

#### 2.1.2 Strony chronione (wymagają uwierzytelnienia)

Wszystkie istniejące strony aplikacji stają się chronione:
- `/generate` - Generowanie fiszek
- `/flashcards` - Moje fiszki
- `/study` - Sesja nauki
- `/history` - Historia generowania
- `/profile` - Profil użytkownika

**Modyfikacje**:
- Middleware sprawdza sesję użytkownika przed renderowaniem
- Brak sesji = przekierowanie do `/login`
- Layout `AppLayout.astro` zostaje rozszerzony o informacje o użytkowniku

---

### 2.2 Komponenty React (client-side)

Lokalizacja: `src/components/`

#### 2.2.1 Formularze autentykacji

##### `LoginForm.tsx`
**Odpowiedzialność**:
- Renderowanie formularza logowania (email + hasło)
- Walidacja po stronie klienta
- Wysyłanie żądania logowania do Supabase Auth
- Obsługa błędów i wyświetlanie komunikatów
- Przekierowanie po pomyślnym logowaniu

**Pola formularza**:
- `email`: string (wymagane, format email)
- `password`: string (wymagane, min 6 znaków)

**Przyciski/Linki**:
- "Zaloguj się" (submit)
- Link do `/register`: "Nie masz konta? Zarejestruj się"
- Link do `/forgot-password`: "Zapomniałeś hasła?"

**Interakcja z backendem**:
- Używa `supabase.auth.signInWithPassword({ email, password })`
- Po sukcesie: Supabase automatycznie ustawia session cookie
- Przekierowanie do `/generate` przez `window.location.href`

**Stany UI**:
- `loading`: boolean (podczas wysyłania)
- `error`: string | null (komunikat błędu)

**Komunikaty błędów**:
- "Nieprawidłowy email lub hasło"
- "Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email."
- "Wystąpił błąd. Spróbuj ponownie."

---

##### `RegisterForm.tsx`
**Odpowiedzialność**:
- Renderowanie formularza rejestracji
- Walidacja danych (email, hasło, potwierdzenie hasła)
- Wysyłanie żądania rejestracji do Supabase Auth
- Wyświetlanie komunikatu o konieczności weryfikacji email
- Obsługa błędów

**Pola formularza**:
- `email`: string (wymagane, format email)
- `password`: string (wymagane, min 8 znaków, wymagania złożoności)
- `confirmPassword`: string (wymagane, musi być identyczne z password)

**Przyciski/Linki**:
- "Zarejestruj się" (submit)
- Link do `/login`: "Masz już konto? Zaloguj się"

**Interakcja z backendem**:
- Używa `supabase.auth.signUp({ email, password })`
- Po sukcesie: wyświetla komunikat o wysłaniu emaila weryfikacyjnego
- Opcjonalnie: automatyczne logowanie jeśli weryfikacja email jest wyłączona

**Walidacja**:
- Email: format RFC 5322
- Hasło: 
  - Minimum 8 znaków
  - Przynajmniej jedna wielka litera
  - Przynajmniej jedna cyfra
  - Przynajmniej jeden znak specjalny
- Potwierdzenie hasła: identyczne z hasłem

**Stany UI**:
- `loading`: boolean
- `error`: string | null
- `success`: boolean (pokazuje komunikat o wysłaniu emaila)

**Komunikaty**:
- Sukces: "Konto zostało utworzone! Sprawdź swoją skrzynkę email, aby zweryfikować adres."
- Błędy:
  - "Email jest już zarejestrowany"
  - "Hasła nie są identyczne"
  - "Hasło musi spełniać wymagania bezpieczeństwa"
  - "Wystąpił błąd. Spróbuj ponownie."

---

##### `ForgotPasswordForm.tsx`
**Odpowiedzialność**:
- Renderowanie formularza z polem email
- Wysyłanie żądania resetowania hasła
- Wyświetlanie komunikatu o wysłaniu linku

**Pola formularza**:
- `email`: string (wymagane, format email)

**Przyciski/Linki**:
- "Wyślij link resetujący" (submit)
- Link do `/login`: "Wróć do logowania"

**Interakcja z backendem**:
- Używa `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:3000/reset-password' })`
- Supabase wysyła email z tokenem resetującym

**Stany UI**:
- `loading`: boolean
- `error`: string | null
- `success`: boolean

**Komunikaty**:
- Sukces: "Link do resetowania hasła został wysłany na adres email. Sprawdź swoją skrzynkę."
- Błędy:
  - "Nie znaleziono konta z podanym adresem email"
  - "Wystąpił błąd. Spróbuj ponownie."

---

##### `ResetPasswordForm.tsx`
**Odpowiedzialność**:
- Renderowanie formularza z nowymi hasłami
- Weryfikacja tokenu z URL
- Wysyłanie żądania zmiany hasła
- Przekierowanie po sukcesie

**Pola formularza**:
- `newPassword`: string (wymagane, min 8 znaków)
- `confirmNewPassword`: string (wymagane, musi być identyczne)

**Przyciski**:
- "Ustaw nowe hasło" (submit)

**Interakcja z backendem**:
- Token jest automatycznie zarządzany przez Supabase (przechowywany w session)
- Używa `supabase.auth.updateUser({ password: newPassword })`
- Po sukcesie: przekierowanie do `/login` z komunikatem sukcesu

**Walidacja**:
- Nowe hasło: te same wymagania co przy rejestracji
- Potwierdzenie: identyczne z nowym hasłem

**Stany UI**:
- `loading`: boolean
- `error`: string | null
- `tokenValid`: boolean (sprawdza czy token jest prawidłowy)

**Komunikaty**:
- Sukces: "Hasło zostało zmienione. Możesz się teraz zalogować."
- Błędy:
  - "Link resetujący wygasł lub jest nieprawidłowy"
  - "Hasła nie są identyczne"
  - "Wystąpił błąd. Spróbuj ponownie."

---

#### 2.2.2 Komponenty nawigacyjne i layoutu

##### Modyfikacja `Sidebar.tsx`
**Istniejące**:
- Nawigacja po aplikacji (Generuj, Moje fiszki, Sesja nauki, Historia, Profil)

**Nowe funkcjonalności**:
- Sekcja użytkownika na dole sidebara
- Wyświetlanie adresu email zalogowanego użytkownika
- Przycisk "Wyloguj się"

**Propsy**:
```typescript
interface SidebarProps {
  currentPath: string;
  userEmail: string; // nowe
}
```

**Struktura sekcji użytkownika**:
```
<div className="border-t p-4 mt-auto">
  <div className="flex items-center gap-3 mb-3">
    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
      <span>{userEmail[0].toUpperCase()}</span>
    </div>
    {isExpanded && (
      <div className="text-sm overflow-hidden">
        <p className="truncate">{userEmail}</p>
      </div>
    )}
  </div>
  {isExpanded && (
    <button onClick={handleLogout} className="w-full">
      Wyloguj się
    </button>
  )}
</div>
```

**Funkcja wylogowania**:
- `handleLogout`: async function
- Wywołuje endpoint `/api/auth/logout` (POST)
- Po sukcesie: przekierowanie do `/login`
- Obsługa błędów z toastem

---

##### Modyfikacja `ProfileView.tsx`
**Istniejące**:
- Wyświetlanie profilu użytkownika

**Nowe funkcjonalności**:
- Sekcja "Zarządzanie kontem"
- Wyświetlanie emaila użytkownika
- Opcja "Usuń konto" z potwierdzeniem
- Informacja o dacie utworzenia konta

**Dodatkowe elementy**:
```typescript
- Email użytkownika (nie edytowalny)
- Data utworzenia konta (read-only)
- Przycisk "Usuń konto" (otwiera dialog potwierdzenia)
```

**Dialog usuwania konta**:
- Komponent `AlertDialog` z Shadcn/ui
- Tytuł: "Czy na pewno chcesz usunąć konto?"
- Opis: "Ta operacja jest nieodwracalna. Wszystkie twoje fiszki i dane zostaną trwale usunięte."
- Checkbox potwierdzenia: "Rozumiem, że ta operacja jest nieodwracalna"
- Przyciski: "Anuluj" | "Usuń konto"

**Interakcja z backendem**:
- POST `/api/auth/delete-account`
- Po sukcesie: przekierowanie do strony pożegnalnej lub `/login`

---

### 2.3 Layouty

#### 2.3.1 `Layout.astro` (publiczny)
**Istniejący**: Minimalny layout dla stron publicznych

**Modyfikacje**:
- Brak - pozostaje bez zmian
- Używany przez strony: `/login`, `/register`, `/forgot-password`, `/reset-password`

**Struktura**:
- `<html>` + `<head>` z metadanymi
- `<body>` z centralnie wyrównanym `<main>`
- Brak nawigacji (Sidebar)
- Stylowanie: Tailwind 4

---

#### 2.3.2 `AppLayout.astro` (chroniony)
**Istniejące**:
- Layout z Sidebar dla zalogowanych użytkowników
- Używany przez wszystkie chronione strony

**Modyfikacje**:
- Przekazywanie `userEmail` do komponentu `Sidebar`
- Pobieranie danych użytkownika z `Astro.locals.user`

**Nowa logika**:
```astro
---
import Sidebar from "../components/Sidebar";
import { Toaster } from "../components/ui/sonner";

interface Props {
  title?: string;
}

const { title = "10x-Cards" } = Astro.props;
const currentPath = Astro.url.pathname;

// Pobierz użytkownika z locals (ustawiane przez middleware)
const user = Astro.locals.user;
const userEmail = user?.email || '';
---

<!doctype html>
<html lang="pl">
  <head>
    <!-- head content -->
  </head>
  <body class="min-h-screen bg-background">
    <div class="flex min-h-screen">
      <Sidebar 
        client:load 
        currentPath={currentPath} 
        userEmail={userEmail} 
      />
      <main class="flex-1 md:ml-64 transition-all duration-300">
        <div class="container mx-auto p-6 md:p-8">
          <slot />
        </div>
      </main>
    </div>
    <Toaster client:load />
  </body>
</html>
```

---

### 2.4 Walidacja i komunikaty błędów

#### 2.4.1 Walidacja po stronie klienta
Wszystkie formularze implementują walidację before submit:

**Email**:
- Format: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Komunikat: "Wprowadź prawidłowy adres email"

**Hasło (logowanie)**:
- Min 6 znaków
- Komunikat: "Hasło musi mieć minimum 6 znaków"

**Hasło (rejestracja/reset)**:
- Min 8 znaków
- Przynajmniej jedna wielka litera
- Przynajmniej jedna cyfra
- Przynajmniej jeden znak specjalny
- Komunikaty:
  - "Hasło musi mieć minimum 8 znaków"
  - "Hasło musi zawierać przynajmniej jedną wielką literę"
  - "Hasło musi zawierać przynajmniej jedną cyfrę"
  - "Hasło musi zawierać przynajmniej jeden znak specjalny"

**Potwierdzenie hasła**:
- Musi być identyczne z hasłem
- Komunikat: "Hasła nie są identyczne"

#### 2.4.2 Komunikaty systemowe (toasty)
Używany komponent: `Toaster` z `sonner` (Shadcn/ui)

**Typy komunikatów**:
- **Success**: zielony, z ikoną checkmark
- **Error**: czerwony, z ikoną błędu
- **Info**: niebieski, z ikoną informacji

**Przykłady użycia**:
```typescript
import { toast } from 'sonner';

// Sukces
toast.success('Zalogowano pomyślnie!');

// Błąd
toast.error('Nieprawidłowy email lub hasło');

// Info
toast.info('Link resetujący został wysłany');
```

---

### 2.5 Scenariusze użytkownika (User flows)

#### 2.5.1 Rejestracja nowego użytkownika
1. Użytkownik wchodzi na `/register`
2. Wypełnia formularz (email, hasło, potwierdzenie hasła)
3. Kliknięcie "Zarejestruj się"
4. Walidacja po stronie klienta
5. Wysłanie żądania do Supabase Auth (`signUp`)
6. Supabase tworzy użytkownika i wysyła email weryfikacyjny
7. Wyświetlenie komunikatu: "Sprawdź swoją skrzynkę email"
8. Użytkownik klika link w emailu
9. Przekierowanie do `/login` z komunikatem "Konto zweryfikowane"
10. Logowanie

**Warianty**:
- Jeśli weryfikacja email jest wyłączona: automatyczne logowanie po rejestracji

---

#### 2.5.2 Logowanie użytkownika
1. Użytkownik wchodzi na `/login`
2. Wypełnia formularz (email, hasło)
3. Kliknięcie "Zaloguj się"
4. Walidacja po stronie klienta
5. Wysłanie żądania do Supabase Auth (`signInWithPassword`)
6. Supabase weryfikuje dane i tworzy sesję
7. Session cookie zostaje ustawiony automatycznie
8. Przekierowanie do `/generate`
9. Middleware weryfikuje sesję przy kolejnych requestach

**Warianty błędów**:
- Nieprawidłowe dane: toast z błędem
- Konto niezweryfikowane: toast z instrukcją

---

#### 2.5.3 Wylogowanie użytkownika
1. Zalogowany użytkownik klika "Wyloguj się" w Sidebar
2. Wysłanie żądania POST do `/api/auth/logout`
3. Backend wywołuje `supabase.auth.signOut()`
4. Usunięcie session cookie
5. Przekierowanie do `/login`
6. Toast: "Wylogowano pomyślnie"

---

#### 2.5.4 Odzyskiwanie hasła
**Część 1: Inicjowanie resetu**
1. Użytkownik wchodzi na `/forgot-password`
2. Wprowadza email
3. Kliknięcie "Wyślij link resetujący"
4. Wysłanie żądania do Supabase Auth (`resetPasswordForEmail`)
5. Supabase wysyła email z linkiem
6. Wyświetlenie komunikatu sukcesu
7. Link pozostaje aktywny przez 1 godzinę

**Część 2: Ustawianie nowego hasła**
1. Użytkownik klika link w emailu
2. Przekierowanie do `/reset-password?token=...`
3. Supabase automatycznie weryfikuje token i tworzy tymczasową sesję
4. Formularz do ustawienia nowego hasła
5. Wprowadzenie nowego hasła (2x)
6. Kliknięcie "Ustaw nowe hasło"
7. Walidacja
8. Wysłanie żądania do Supabase Auth (`updateUser`)
9. Przekierowanie do `/login` z komunikatem sukcesu

**Warianty błędów**:
- Token wygasł: komunikat z możliwością ponownego wysłania
- Konto nie istnieje: komunikat ogólny (z bezpieczeństwa)

---

#### 2.5.5 Usuwanie konta
1. Zalogowany użytkownik wchodzi na `/profile`
2. Klika "Usuń konto"
3. Otwiera się dialog potwierdzenia
4. Użytkownik zaznacza checkbox "Rozumiem..."
5. Klika "Usuń konto"
6. Wysłanie żądania POST do `/api/auth/delete-account`
7. Backend:
   - Usuwa wszystkie fiszki użytkownika (cascade)
   - Usuwa wszystkie generacje użytkownika (cascade)
   - Usuwa konto z Supabase Auth
8. Przekierowanie do `/login` (lub strony pożegnalnej)
9. Toast: "Twoje konto zostało usunięte"

---

## 3. LOGIKA BACKENDOWA

### 3.1 Middleware autentykacji

#### 3.1.1 Plik: `src/middleware/index.ts`
**Istniejący**: Tworzy instancję klienta Supabase w `context.locals.supabase`

**Nowa implementacja**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";

// Definiujemy chronione ścieżki
const PROTECTED_ROUTES = [
  '/generate',
  '/flashcards',
  '/study',
  '/history',
  '/profile',
  '/api/flashcards',
  '/api/generations',
];

// Definiujemy publiczne ścieżki
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

export const onRequest = defineMiddleware(async (context, next) => {
  // Tworzymy Supabase Server Client (SSR-friendly)
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return context.cookies.get(key)?.value;
        },
        set(key, value, options) {
          context.cookies.set(key, value, options);
        },
        remove(key, options) {
          context.cookies.delete(key, options);
        },
      },
    }
  );

  // Zapisz klienta w locals
  context.locals.supabase = supabase;

  // Pobierz sesję użytkownika
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Zapisz użytkownika w locals
  context.locals.user = session?.user ?? null;
  context.locals.session = session;

  const pathname = context.url.pathname;

  // Sprawdź czy ścieżka jest chroniona
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Sprawdź czy ścieżka jest publiczna
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Jeśli chroniona ścieżka i brak sesji -> przekieruj do /login
  if (isProtectedRoute && !session) {
    return context.redirect('/login');
  }

  // Jeśli publiczna ścieżka auth (login/register) i użytkownik zalogowany -> przekieruj do /generate
  if (
    (pathname === '/login' || pathname === '/register') &&
    session
  ) {
    return context.redirect('/generate');
  }

  // Kontynuuj
  const response = await next();

  return response;
});
```

**Funkcjonalność**:
1. Tworzy Supabase Server Client z obsługą cookies (SSR)
2. Pobiera sesję użytkownika z Supabase Auth
3. Zapisuje `user` i `session` w `context.locals`
4. Chroni ścieżki zdefiniowane w `PROTECTED_ROUTES`
5. Przekierowuje niezalogowanych użytkowników do `/login`
6. Przekierowuje zalogowanych użytkowników z `/login` i `/register` do `/generate`

**Typy dla `context.locals`**:
```typescript
// src/env.d.ts (rozszerzenie)
declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
    user: User | null;
    session: Session | null;
  }
}
```

---

### 3.2 Endpointy API autentykacji

Lokalizacja: `src/pages/api/auth/`

#### 3.2.1 `/api/auth/logout` - Wylogowanie
**Plik**: `src/pages/api/auth/logout.ts`

**Metoda**: `POST`

**Opis**: Wylogowuje użytkownika, usuwając sesję z Supabase.

**Request**:
- Brak body
- Sesja identyfikowana przez cookie

**Response**:
- **200 OK**:
```json
{
  "message": "Wylogowano pomyślnie"
}
```
- **401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "Brak sesji użytkownika"
}
```
- **500 Internal Server Error**:
```json
{
  "error": "Internal Server Error",
  "message": "Nie udało się wylogować"
}
```

**Implementacja**:
```typescript
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals, cookies }) => {
  const { supabase, session } = locals;

  if (!session) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Brak sesji użytkownika',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ message: 'Wylogowano pomyślnie' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Nie udało się wylogować',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

#### 3.2.2 `/api/auth/delete-account` - Usuwanie konta
**Plik**: `src/pages/api/auth/delete-account.ts`

**Metoda**: `POST`

**Opis**: Usuwa konto użytkownika wraz ze wszystkimi powiązanymi danymi.

**Request**:
- Brak body
- Użytkownik identyfikowany przez sesję

**Response**:
- **200 OK**:
```json
{
  "message": "Konto zostało usunięte"
}
```
- **401 Unauthorized**:
```json
{
  "error": "Unauthorized",
  "message": "Brak sesji użytkownika"
}
```
- **500 Internal Server Error**:
```json
{
  "error": "Internal Server Error",
  "message": "Nie udało się usunąć konta"
}
```

**Implementacja**:
```typescript
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  const { supabase, user, session } = locals;

  if (!session || !user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Brak sesji użytkownika',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Usuwanie użytkownika automatycznie kaskadowo usuwa wszystkie powiązane dane
    // dzięki ON DELETE CASCADE w migracji bazy danych
    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      throw error;
    }

    // Wyloguj (usuń sesję)
    await supabase.auth.signOut();

    return new Response(
      JSON.stringify({ message: 'Konto zostało usunięte' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Nie udało się usunąć konta',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

**Uwaga**: 
- `supabase.auth.admin.deleteUser()` wymaga uprawnień service_role
- Alternatywnie można użyć Supabase Database Function lub Edge Function

---

### 3.3 Modyfikacje istniejących endpointów API

Wszystkie istniejące endpointy API wymagają dodania logiki uwierzytelniania:

#### 3.3.1 Flashcards endpoints
**Pliki**:
- `src/pages/api/flashcards/index.ts`
- `src/pages/api/flashcards/[id].ts`
- `src/pages/api/flashcards/batch.ts`

**Modyfikacje**:
1. Sprawdzanie sesji na początku każdej metody:
```typescript
export const GET: APIRoute = async ({ locals, url }) => {
  const { user } = locals;
  
  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Musisz być zalogowany',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Reszta logiki...
};
```

2. Filtrowanie danych po `user_id`:
```typescript
// Przykład dla GET /api/flashcards
const { data, error } = await supabase
  .from('flashcards')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

3. Automatyczne dodawanie `user_id` przy tworzeniu:
```typescript
// Przykład dla POST /api/flashcards
const { data, error } = await supabase
  .from('flashcards')
  .insert({
    front: body.front,
    back: body.back,
    source: 'manual',
    user_id: user.id, // automatycznie z sesji
  })
  .select()
  .single();
```

**Uwaga**: RLS Policies w bazie danych zapewniają dodatkową warstwę ochrony.

---

#### 3.3.2 Generations endpoint
**Plik**: `src/pages/api/generations/index.ts`

**Modyfikacje**: Identyczne jak dla flashcards - sprawdzanie sesji i filtrowanie po `user_id`.

---

### 3.4 Renderowanie stron server-side

#### 3.4.1 Chronione strony Astro
Wszystkie chronione strony (`/generate`, `/flashcards`, etc.) są automatycznie chronione przez middleware.

**Dostęp do użytkownika w stronie**:
```astro
---
// src/pages/generate.astro
import AppLayout from "../layouts/AppLayout.astro";
import GenerateView from "../components/GenerateView";

const user = Astro.locals.user;
// user jest dostępny dzięki middleware
---

<AppLayout title="Generuj fiszki | 10x-Cards">
  <GenerateView client:load />
</AppLayout>
```

---

#### 3.4.2 Publiczne strony Astro
Strony autentykacji są dostępne dla wszystkich, ale przekierowują zalogowanych użytkowników.

**Przykład `/login`**:
```astro
---
// src/pages/login.astro
import Layout from "../layouts/Layout.astro";
import LoginForm from "../components/LoginForm";

const session = Astro.locals.session;

// Jeśli zalogowany, przekieruj (middleware robi to automatycznie)
---

<Layout title="Logowanie | 10x-Cards">
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <LoginForm client:load />
    </div>
  </div>
</Layout>
```

---

### 3.5 Walidacja danych wejściowych

#### 3.5.1 Schemat walidacji (Zod)
**Plik**: `src/lib/schemas/auth.schema.ts`

```typescript
import { z } from 'zod';

// Email schema
export const emailSchema = z
  .string()
  .email('Wprowadź prawidłowy adres email')
  .min(1, 'Email jest wymagany');

// Password schema (logowanie)
export const loginPasswordSchema = z
  .string()
  .min(6, 'Hasło musi mieć minimum 6 znaków');

// Password schema (rejestracja/reset)
export const passwordSchema = z
  .string()
  .min(8, 'Hasło musi mieć minimum 8 znaków')
  .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
  .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę')
  .regex(
    /[^A-Za-z0-9]/,
    'Hasło musi zawierać przynajmniej jeden znak specjalny'
  );

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

// Register schema
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  });

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmNewPassword'],
  });
```

**Użycie w komponentach React**:
```typescript
import { loginSchema } from '@/lib/schemas/auth.schema';

// W komponencie
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const validatedData = loginSchema.parse({ email, password });
    // Kontynuuj z zwalidowanymi danymi
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Wyświetl błędy walidacji
      setErrors(error.flatten().fieldErrors);
    }
  }
};
```

---

### 3.6 Obsługa wyjątków

#### 3.6.1 Kody błędów Supabase Auth
Mapowanie kodów błędów na przyjazne komunikaty:

**Plik**: `src/lib/utils/auth-errors.ts`

```typescript
export function getAuthErrorMessage(error: any): string {
  const errorCode = error?.code || error?.error_code;
  const errorMessage = error?.message || '';

  // Mapowanie kodów błędów
  const errorMap: Record<string, string> = {
    'invalid_credentials': 'Nieprawidłowy email lub hasło',
    'email_exists': 'Email jest już zarejestrowany',
    'email_not_confirmed': 'Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę email.',
    'user_not_found': 'Nie znaleziono użytkownika',
    'invalid_grant': 'Link resetujący wygasł lub jest nieprawidłowy',
    'weak_password': 'Hasło jest zbyt słabe',
    'over_email_send_rate_limit': 'Zbyt wiele prób. Spróbuj ponownie później.',
  };

  return errorMap[errorCode] || 'Wystąpił błąd. Spróbuj ponownie.';
}
```

**Użycie**:
```typescript
import { getAuthErrorMessage } from '@/lib/utils/auth-errors';

try {
  await supabase.auth.signInWithPassword({ email, password });
} catch (error) {
  const message = getAuthErrorMessage(error);
  toast.error(message);
}
```

---

#### 3.6.2 Centralna obsługa błędów w komponentach
Każdy formularz implementuje pattern:

```typescript
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // Walidacja
    // Wywołanie API
    // Sukces
  } catch (err) {
    const message = getAuthErrorMessage(err);
    setError(message);
    toast.error(message);
  } finally {
    setLoading(false);
  }
};
```

---

## 4. SYSTEM AUTENTYKACJI

### 4.1 Supabase Auth - Konfiguracja

#### 4.1.1 Zmienne środowiskowe
**Plik**: `.env`

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URLs (dla resetowania hasła, etc.)
PUBLIC_APP_URL=http://localhost:3000
```

**Uwagi**:
- `SUPABASE_ANON_KEY`: używany na frontendzie i w middleware
- `SUPABASE_SERVICE_ROLE_KEY`: używany tylko w operacjach admin (usuwanie konta)
- `PUBLIC_APP_URL`: używany jako `redirectTo` w emailach Supabase

---

#### 4.1.2 Konfiguracja Supabase Auth w Dashboard

**Email Templates**:
1. Confirm Signup:
   - Subject: "Potwierdź swoje konto w 10x-Cards"
   - Link: `{{ .ConfirmationURL }}`

2. Reset Password:
   - Subject: "Zresetuj hasło w 10x-Cards"
   - Link: `{{ .ConfirmationURL }}`

**Authentication Settings**:
- Enable Email Confirmation: **Yes** (dla produkcji)
- Minimum Password Length: **8**
- Email Redirect URLs: Dodaj `http://localhost:3000/reset-password` i domenę produkcyjną

**OAuth Providers**: Poza zakresem MVP

---

### 4.2 Zarządzanie sesjami

#### 4.2.1 Jak działają sesje w Supabase
1. **Logowanie**: 
   - `signInWithPassword()` tworzy session z `access_token` i `refresh_token`
   - Tokeny są przechowywane w HTTP-only cookies przez Supabase SSR

2. **Weryfikacja sesji**:
   - `getSession()` w middleware pobiera sesję z cookies
   - Access token wygasa po 1 godzinie
   - Refresh token jest używany do automatycznego odświeżania

3. **Wylogowanie**:
   - `signOut()` usuwa cookies i kończy sesję

4. **Bezpieczeństwo**:
   - HTTP-only cookies chronią przed XSS
   - Secure flag w produkcji (HTTPS)
   - SameSite=Lax dla ochrony przed CSRF

---

#### 4.2.2 Supabase Server Client (SSR)
**Używany w middleware i stronach Astro**:

```typescript
import { createServerClient } from '@supabase/ssr';

const supabase = createServerClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY,
  {
    cookies: {
      get(key) {
        return context.cookies.get(key)?.value;
      },
      set(key, value, options) {
        context.cookies.set(key, value, options);
      },
      remove(key, options) {
        context.cookies.delete(key, options);
      },
    },
  }
);
```

---

#### 4.2.3 Supabase Browser Client (React)
**Używany w komponentach React**:

**Plik**: `src/lib/supabase-browser.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/db/database.types';

export const supabaseBrowser = createBrowserClient<Database>(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);
```

**Użycie w komponencie**:
```typescript
import { supabaseBrowser } from '@/lib/supabase-browser';

const handleLogin = async () => {
  const { data, error } = await supabaseBrowser.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    // obsługa błędu
  } else {
    // przekierowanie
    window.location.href = '/generate';
  }
};
```

---

### 4.3 Integracja z istniejącymi endpointami API

#### 4.3.1 Automatyczne filtrowanie po user_id
Wszystkie operacje na fiszkach i generacjach muszą być filtrowane po `user_id` z sesji:

**GET zapytania**:
```typescript
const { data } = await supabase
  .from('flashcards')
  .select('*')
  .eq('user_id', user.id); // filtruj po zalogowanym użytkowniku
```

**INSERT zapytania**:
```typescript
const { data } = await supabase
  .from('flashcards')
  .insert({
    ...flashcardData,
    user_id: user.id, // automatycznie z sesji
  });
```

**UPDATE zapytania**:
```typescript
const { data } = await supabase
  .from('flashcards')
  .update({ front, back })
  .eq('id', flashcardId)
  .eq('user_id', user.id); // upewnij się, że należy do użytkownika
```

**DELETE zapytania**:
```typescript
const { data } = await supabase
  .from('flashcards')
  .delete()
  .eq('id', flashcardId)
  .eq('user_id', user.id); // upewnij się, że należy do użytkownika
```

---

#### 4.3.2 Row Level Security (RLS) jako dodatkowa warstwa
RLS Policies w bazie danych zapewniają, że nawet jeśli kod ma błąd, użytkownik nie będzie mógł uzyskać dostępu do cudzych danych.

**Istniejące policies** (z migracji):
- `authenticated_users_can_select_own_flashcards`
- `authenticated_users_can_insert_own_flashcards`
- `authenticated_users_can_update_own_flashcards`
- `authenticated_users_can_delete_own_flashcards`

Analogicznie dla `generations` i `generation_error_logs`.

---

### 4.4 Ochrona zasobów użytkownika

#### 4.4.1 Prywatność danych
**Zasada**: Każdy użytkownik widzi tylko swoje zasoby.

**Implementacja**:
1. Middleware weryfikuje sesję przed dostępem do chronionych stron
2. API endpoints sprawdzają `user_id` z sesji
3. Wszystkie zapytania do bazy filtrują po `user_id`
4. RLS Policies w bazie danych jako ostateczna bariera

---

#### 4.4.2 Nie ma współdzielenia między użytkownikami
**Poza zakresem MVP**:
- Publiczne zestawy fiszek
- Współdzielenie fiszek
- Współpraca nad zestawami

Wszystkie zasoby są prywatne dla użytkownika, który je utworzył.

---

### 4.5 Bezpieczeństwo

#### 4.5.1 Best practices
1. **Hasła**:
   - Minimum 8 znaków
   - Wymagania złożoności (wielka litera, cyfra, znak specjalny)
   - Hashowane przez Supabase Auth (bcrypt)

2. **Tokeny**:
   - JWT access tokens z krótkim czasem życia (1h)
   - Refresh tokens z długim czasem życia (30 dni)
   - HTTP-only cookies

3. **Rate limiting**:
   - Supabase automatycznie limituje zapytania auth (email sending, etc.)
   - Rozważyć dodatkowy rate limiting dla API endpoints

4. **HTTPS**:
   - Wymagane w produkcji
   - Secure cookies tylko przez HTTPS

5. **CSRF Protection**:
   - SameSite=Lax cookies
   - Astro automatycznie obsługuje CSRF dla form submissions

---

#### 4.5.2 RODO i prywatność
**Zgodność z wymaganiami**:
1. **Prawo do wglądu**: 
   - Użytkownik widzi swoje dane w profilu
   - API endpoints zwracają tylko dane użytkownika

2. **Prawo do usunięcia**:
   - Funkcja usuwania konta w profilu
   - Kaskadowe usuwanie wszystkich powiązanych danych

3. **Minimalizacja danych**:
   - Zbierane tylko niezbędne dane (email, hasło)
   - Brak dodatkowych danych osobowych w MVP

4. **Bezpieczeństwo przechowywania**:
   - Supabase zapewnia szyfrowanie danych
   - Backup i recovery przez Supabase

---

## 5. PRZEPŁYW DANYCH

### 5.1 Diagram przepływu - Logowanie

```
┌─────────────┐
│   Browser   │
│  /login     │
└──────┬──────┘
       │
       │ 1. Wprowadź email/hasło
       │ 2. Submit form
       ▼
┌──────────────────┐
│   LoginForm.tsx  │
│   (React)        │
└──────┬───────────┘
       │
       │ 3. Walidacja (Zod)
       │ 4. supabase.auth.signInWithPassword()
       ▼
┌───────────────────┐
│  Supabase Auth    │
│  (External API)   │
└──────┬────────────┘
       │
       │ 5. Weryfikacja credentials
       │ 6. Zwraca session (access + refresh tokens)
       ▼
┌──────────────────┐
│  Browser         │
│  (cookies set)   │
└──────┬───────────┘
       │
       │ 7. window.location.href = '/generate'
       ▼
┌──────────────────┐
│  Middleware      │
│  (SSR)           │
└──────┬───────────┘
       │
       │ 8. getSession() z cookies
       │ 9. Zapisz user w locals
       ▼
┌──────────────────┐
│  /generate       │
│  (Protected)     │
└──────────────────┘
```

---

### 5.2 Diagram przepływu - Dostęp do chronionych zasobów

```
┌─────────────┐
│   Browser   │
│  GET /flashcards │
└──────┬──────┘
       │
       │ 1. Request z session cookie
       ▼
┌──────────────────┐
│  Middleware      │
│  (SSR)           │
└──────┬───────────┘
       │
       │ 2. supabase.auth.getSession()
       │ 3. Sprawdź czy ścieżka chroniona
       │
       ├─ Brak sesji? ──► Redirect /login
       │
       │ 4. Session OK, zapisz user w locals
       ▼
┌──────────────────┐
│  flashcards.astro│
└──────┬───────────┘
       │
       │ 5. Renderuj stronę z AppLayout
       │ 6. Przekaż userEmail do Sidebar
       ▼
┌──────────────────┐
│  FlashcardsList  │
│  (React)         │
└──────┬───────────┘
       │
       │ 7. Fetch GET /api/flashcards
       ▼
┌──────────────────┐
│  API Handler     │
└──────┬───────────┘
       │
       │ 8. Sprawdź locals.user
       │ 9. Query Supabase: WHERE user_id = user.id
       │ 10. RLS Policy weryfikuje user_id
       ▼
┌──────────────────┐
│  Supabase DB     │
│  (RLS enabled)   │
└──────┬───────────┘
       │
       │ 11. Zwróć fiszki użytkownika
       ▼
┌──────────────────┐
│  Response JSON   │
│  (200 OK)        │
└──────────────────┘
```

---

### 5.3 Diagram przepływu - Reset hasła

```
┌─────────────────┐
│   Browser       │
│  /forgot-password│
└──────┬──────────┘
       │
       │ 1. Wprowadź email
       │ 2. Submit
       ▼
┌──────────────────────────┐
│  ForgotPasswordForm.tsx  │
└──────┬───────────────────┘
       │
       │ 3. supabase.auth.resetPasswordForEmail()
       ▼
┌───────────────────┐
│  Supabase Auth    │
└──────┬────────────┘
       │
       │ 4. Wyślij email z linkiem
       │    Link: /reset-password?token=...
       ▼
┌─────────────────┐
│   Email Client  │
└──────┬──────────┘
       │
       │ 5. Użytkownik klika link
       ▼
┌─────────────────┐
│   Browser       │
│  /reset-password│
└──────┬──────────┘
       │
       │ 6. Supabase weryfikuje token (auto)
       │ 7. Tworzy tymczasową sesję
       ▼
┌──────────────────────┐
│  ResetPasswordForm   │
└──────┬───────────────┘
       │
       │ 8. Wprowadź nowe hasło
       │ 9. supabase.auth.updateUser()
       ▼
┌───────────────────┐
│  Supabase Auth    │
└──────┬────────────┘
       │
       │ 10. Aktualizuj hasło
       │ 11. Zwróć sukces
       ▼
┌─────────────────┐
│   Browser       │
│  Redirect /login│
└─────────────────┘
```

---

## 6. TYPY I INTERFEJSY

### 6.1 Typy dla autentykacji

**Plik**: `src/types.ts` (rozszerzenie)

```typescript
// Supabase Auth types
import type { User, Session } from '@supabase/supabase-js';

/**
 * User data available in components and pages
 * Derived from Supabase User type
 */
export type AuthUser = User;

/**
 * Session data available in middleware and pages
 */
export type AuthSession = Session;

/**
 * Login request DTO
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Register request DTO
 */
export interface RegisterDTO {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Forgot password request DTO
 */
export interface ForgotPasswordDTO {
  email: string;
}

/**
 * Reset password request DTO
 */
export interface ResetPasswordDTO {
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * Auth API response types
 */
export interface AuthSuccessResponseDTO {
  message: string;
}

export interface AuthErrorResponseDTO {
  error: string;
  message: string;
  details?: unknown;
}
```

---

### 6.2 Typy dla Astro context

**Plik**: `src/env.d.ts` (aktualizacja)

```typescript
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { SupabaseClient, User, Session } from '@supabase/supabase-js';
import type { Database } from './db/database.types';

declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
    user: User | null;
    session: Session | null;
  }
}
```

---

## 7. PLAN IMPLEMENTACJI

### 7.1 Faza 1: Infrastruktura (priorytet: wysoki)

**Zadania**:
1. Aktualizacja `src/middleware/index.ts`:
   - Implementacja Supabase Server Client
   - Weryfikacja sesji
   - Ochrona chronionych ścieżek
   - Przekierowania

2. Utworzenie `src/lib/supabase-browser.ts`:
   - Konfiguracja Supabase Browser Client dla React

3. Aktualizacja typów w `src/env.d.ts`:
   - Rozszerzenie `App.Locals` o `user` i `session`

4. Konfiguracja zmiennych środowiskowych:
   - `.env` z kluczami Supabase

**Zależności**: Brak

**Czas realizacji**: 2-3 godziny

---

### 7.2 Faza 2: Schematy walidacji (priorytet: wysoki)

**Zadania**:
1. Utworzenie `src/lib/schemas/auth.schema.ts`:
   - Schematy Zod dla logowania, rejestracji, resetu hasła

2. Utworzenie `src/lib/utils/auth-errors.ts`:
   - Mapowanie kodów błędów Supabase na komunikaty

**Zależności**: Brak

**Czas realizacji**: 1-2 godziny

---

### 7.3 Faza 3: Komponenty formularzy (priorytet: wysoki)

**Zadania**:
1. `src/components/LoginForm.tsx`
2. `src/components/RegisterForm.tsx`
3. `src/components/ForgotPasswordForm.tsx`
4. `src/components/ResetPasswordForm.tsx`

**Funkcjonalności**:
- Walidacja z Zod
- Obsługa błędów
- Loading states
- Integracja z Supabase Auth
- Toasty (sonner)

**Zależności**: Faza 1, Faza 2

**Czas realizacji**: 6-8 godzin

---

### 7.4 Faza 4: Strony autentykacji (priorytet: wysoki)

**Zadania**:
1. `src/pages/login.astro`
2. `src/pages/register.astro`
3. `src/pages/forgot-password.astro`
4. `src/pages/reset-password.astro`

**Zależności**: Faza 3

**Czas realizacji**: 2-3 godziny

---

### 7.5 Faza 5: API endpoints (priorytet: średni)

**Zadania**:
1. `src/pages/api/auth/logout.ts`
2. `src/pages/api/auth/delete-account.ts`

**Zależności**: Faza 1

**Czas realizacji**: 2-3 godziny

---

### 7.6 Faza 6: Modyfikacje layoutu i nawigacji (priorytet: średni)

**Zadania**:
1. Aktualizacja `src/layouts/AppLayout.astro`:
   - Przekazywanie `userEmail` do Sidebar

2. Aktualizacja `src/components/Sidebar.tsx`:
   - Sekcja użytkownika
   - Przycisk wylogowania

3. Aktualizacja `src/components/ProfileView.tsx`:
   - Sekcja zarządzania kontem
   - Dialog usuwania konta

**Zależności**: Faza 1, Faza 5

**Czas realizacji**: 3-4 godziny

---

### 7.7 Faza 7: Ochrona istniejących API (priorytet: wysoki)

**Zadania**:
1. Aktualizacja `src/pages/api/flashcards/index.ts`:
   - Sprawdzanie sesji
   - Filtrowanie po `user_id`

2. Aktualizacja `src/pages/api/flashcards/[id].ts`:
   - Sprawdzanie sesji
   - Weryfikacja własności zasobu

3. Aktualizacja `src/pages/api/flashcards/batch.ts`:
   - Sprawdzanie sesji
   - Dodawanie `user_id` przy tworzeniu

4. Aktualizacja `src/pages/api/generations/index.ts`:
   - Sprawdzanie sesji
   - Filtrowanie po `user_id`

**Zależności**: Faza 1

**Czas realizacji**: 3-4 godziny

---

### 7.8 Faza 8: Testowanie i debugowanie (priorytet: wysoki)

**Zadania**:
1. Testy rejestracji (z weryfikacją email i bez)
2. Testy logowania (poprawne i błędne dane)
3. Testy wylogowania
4. Testy resetu hasła (end-to-end)
5. Testy ochrony zasobów (próba dostępu bez sesji)
6. Testy RLS policies w Supabase
7. Testy usuwania konta (kaskadowe usuwanie danych)

**Zależności**: Wszystkie poprzednie fazy

**Czas realizacji**: 4-6 godzin

---

### 7.9 Podsumowanie czasowe

**Całkowity szacowany czas**: 23-33 godziny (3-4 dni pracy)

**Kolejność priorytetów**:
1. Faza 1: Infrastruktura (fundament)
2. Faza 2: Walidacja (niezbędne dla formularzy)
3. Faza 3 + 4: Formularze i strony (core functionality)
4. Faza 7: Ochrona API (kluczowe dla bezpieczeństwa)
5. Faza 5 + 6: Wylogowanie i UI (dopełnienie)
6. Faza 8: Testowanie (weryfikacja)

---

## 8. KONFIGURACJA SUPABASE

### 8.1 Wymagane ustawienia

**Authentication Settings**:
1. Email Provider:
   - ✅ Enable Email provider
   - ✅ Confirm email (dla produkcji)
   - Email template: dostosować do brandingu 10x-Cards

2. Password Settings:
   - Minimum password length: **8**

3. Security Settings:
   - Enable RLS (już włączone w migracji)
   - Session timeout: 1 hour (access token)
   - Refresh token lifetime: 30 days

4. Email Templates:
   - Dostosować treść emaili (rejestracja, reset hasła)
   - Dodać logo 10x-Cards

5. Redirect URLs:
   - Development: `http://localhost:3000/reset-password`
   - Production: `https://yourdomain.com/reset-password`

---

### 8.2 Testowanie Supabase Auth lokalnie

**Opcja 1: Supabase Cloud (rekomendowane dla MVP)**:
- Utworzenie projektu na https://supabase.com
- Konfiguracja email settings
- Testing z prawdziwymi emailami

**Opcja 2: Supabase Local Dev (opcjonalnie)**:
- `npx supabase init`
- `npx supabase start`
- InBucket do testowania emaili (local)

---

## 9. SCENARIUSZE TESTOWE

### 9.1 Test rejestracji

**Przypadki**:
1. ✅ Poprawna rejestracja z weryfikacją email
2. ✅ Poprawna rejestracja bez weryfikacji email (dev mode)
3. ❌ Email już istnieje
4. ❌ Hasło zbyt słabe
5. ❌ Hasła nie pasują
6. ❌ Nieprawidłowy format email

---

### 9.2 Test logowania

**Przypadki**:
1. ✅ Poprawne logowanie
2. ❌ Nieprawidłowe hasło
3. ❌ Nieistniejący email
4. ❌ Konto niezweryfikowane (jeśli weryfikacja włączona)
5. ✅ Automatyczne przekierowanie zalogowanego użytkownika z /login do /generate

---

### 9.3 Test wylogowania

**Przypadki**:
1. ✅ Wylogowanie z aplikacji
2. ✅ Brak dostępu do chronionych stron po wylogowaniu
3. ✅ Przekierowanie do /login przy próbie dostępu

---

### 9.4 Test resetu hasła

**Przypadki**:
1. ✅ Wysłanie emaila z linkiem
2. ✅ Kliknięcie linku i ustawienie nowego hasła
3. ✅ Logowanie z nowym hasłem
4. ❌ Link wygasły (po 1 godzinie)
5. ❌ Link użyty więcej niż raz
6. ❌ Hasła nie pasują przy resetowaniu

---

### 9.5 Test ochrony zasobów

**Przypadki**:
1. ✅ Użytkownik A widzi tylko swoje fiszki
2. ❌ Użytkownik A nie może uzyskać dostępu do fiszek użytkownika B (poprzez API)
3. ✅ RLS Policy blokuje zapytania do cudzych danych
4. ✅ Middleware blokuje dostęp do chronionych stron bez sesji

---

### 9.6 Test usuwania konta

**Przypadki**:
1. ✅ Usunięcie konta wraz z fiszkami
2. ✅ Usunięcie konta wraz z generacjami
3. ✅ Brak dostępu po usunięciu konta
4. ✅ Możliwość ponownej rejestracji tym samym emailem

---

## 10. NAJLEPSZE PRAKTYKI I UWAGI

### 10.1 Bezpieczeństwo

1. **Nigdy nie loguj haseł** w konsoli lub logach
2. **Używaj HTTPS** w produkcji (wymóg dla secure cookies)
3. **Rate limiting** na endpointy auth (Supabase robi to automatycznie)
4. **Sanityzacja inputów** (Zod + React chroni przed XSS)
5. **CSRF protection** (Astro + SameSite cookies)

---

### 10.2 User Experience

1. **Loading states** we wszystkich formularzach
2. **Wyraźne komunikaty błędów** (bez ujawniania szczegółów technicznych)
3. **Toasty** dla akcji użytkownika (sukces/błąd)
4. **Automatyczne przekierowania** po akcjach (logowanie → /generate)
5. **Disabled buttons** podczas wysyłania formularza (zapobiega double submit)

---

### 10.3 Dostępność (a11y)

1. **Label** dla każdego input
2. **aria-label** dla przycisków ikonowych
3. **aria-describedby** dla komunikatów błędów
4. **focus states** wyraźnie widoczne
5. **Keyboard navigation** działa we wszystkich formularzach
6. **Screen reader friendly** error messages

---

### 10.4 Performance

1. **Lazy loading** komponentów React (`client:load`)
2. **Minimalna ilość JS** na publicznych stronach
3. **SSR** dla chronionych stron (szybsze pierwsze ładowanie)
4. **Optymalizacja obrazów** (jeśli będą dodane w przyszłości)

---

### 10.5 Maintenance

1. **Centralna walidacja** (Zod schemas w jednym miejscu)
2. **Centralne mapowanie błędów** (auth-errors.ts)
3. **Reusable patterns** (każdy formularz działa podobnie)
4. **TypeScript strict mode** (catch errors at compile time)
5. **Comments** w kluczowych miejscach

---

## 11. PODSUMOWANIE

### 11.1 Kluczowe komponenty

**Frontend**:
- 4 strony autentykacji (`/login`, `/register`, `/forgot-password`, `/reset-password`)
- 4 formularze React (LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm)
- Aktualizacje Sidebar i ProfileView

**Backend**:
- Middleware z weryfikacją sesji i ochroną ścieżek
- 2 endpointy API (`/api/auth/logout`, `/api/auth/delete-account`)
- Aktualizacje wszystkich istniejących API endpoints (sprawdzanie sesji, filtrowanie po user_id)

**Infrastruktura**:
- Supabase Auth jako dostawca autentykacji
- Supabase SSR dla server-side
- Supabase Browser Client dla client-side
- RLS Policies w bazie danych

---

### 11.2 Zgodność z wymaganiami

**US-001 (Rejestracja)**: ✅
- Formularz rejestracyjny
- Weryfikacja email
- Potwierdzenie rejestracji

**US-002 (Logowanie)**: ✅
- Formularz logowania
- Weryfikacja credentials
- Przekierowanie do /generate
- Bezpieczne przechowywanie sesji

**US-010 (Wylogowanie)**: ✅
- Przycisk wylogowania w Sidebar
- Zakończenie sesji
- Przekierowanie do /login
- Brak dostępu do chronionych zasobów

**US-011 (Reset hasła)**: ✅
- Link "Zapomniałeś hasła?"
- Email z linkiem resetującym
- Formularz ustawienia nowego hasła
- Link jednorazowy

**US-009 (Bezpieczeństwo)**: ✅
- Autoryzacja na poziomie middleware
- Filtrowanie danych po user_id
- RLS Policies w bazie danych
- Brak dostępu do danych innych użytkowników

---

### 11.3 Następne kroki

Po implementacji systemu autentykacji:
1. **Testowanie end-to-end** wszystkich scenariuszy
2. **Konfiguracja Supabase** w środowisku produkcyjnym
3. **Dostosowanie email templates** do brandingu
4. **Monitoring** i logowanie błędów autentykacji
5. **Dokumentacja** dla użytkowników końcowych (opcjonalnie)

---

### 11.4 Przyszłe rozszerzenia (poza MVP)

- OAuth providers (Google, GitHub)
- Dwuskładnikowa autentykacja (2FA)
- Zapamiętaj mnie (extend session)
- Zmiana emaila
- Zmiana hasła (bez resetu)
- Historia logowań
- Sesje aktywne (zarządzanie urządzeniami)

---

**Koniec specyfikacji**
