# Flow Diagram - Strony Autentykacji

## Mapa nawigacji

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      /login                                 │
│                   (LoginForm)                               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Email: [________________]                            │  │
│  │ Hasło: [________________]                            │  │
│  │                          [Zapomniałeś hasła?] ───────┼──┼─┐
│  │                                                      │  │ │
│  │ [        Zaloguj się        ]                       │  │ │
│  │                                                      │  │ │
│  │ Nie masz konta? [Zarejestruj się] ──────────────────┼──┼─┼─┐
│  └──────────────────────────────────────────────────────┘  │ │ │
│                                                             │ │ │
└─────────────────────────────────────────────────────────────┘ │ │
                                                                │ │
                                                                │ │
┌───────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                    /forgot-password                              │
│                  (ForgotPasswordForm)                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Email: [________________]                              │     │
│  │                                                         │     │
│  │ [   Wyślij link resetujący   ]                        │     │
│  │                                                         │     │
│  │ ← [Wróć do logowania] ─────────────────────────────────┼─────┘
│  └────────────────────────────────────────────────────────┘
│                       │
│                       │ (użytkownik dostaje email)
│                       ▼
│                  /reset-password
│                (ResetPasswordForm)
│
│  ┌────────────────────────────────────────────────────────┐
│  │ Nowe hasło: [________________]                         │
│  │ Potwierdź hasło: [________________]                    │
│  │                                                         │
│  │ [     Ustaw nowe hasło     ]                          │
│  │                                                         │
│  └────────────────────────────────────────────────────────┘
│                       │
│                       │ (sukces)
│                       ▼
│                   /login
└──────────────────────────────────────────────────────────────┐
                                                                │
                                                                │
                    /register                                   │
                  (RegisterForm)                                │
                                                                │
  ┌──────────────────────────────────────────────────────────┐ │
  │ Email: [________________]                                │ │
  │ Hasło: [________________]                                │ │
  │ Potwierdź hasło: [________________]                      │ │
  │                                                           │ │
  │ [       Zarejestruj się       ]                          │ │
  │                                                           │ │
  │ Masz już konto? [Zaloguj się] ───────────────────────────┼─┘
  └──────────────────────────────────────────────────────────┘
                      │
                      │ (sukces)
                      ▼
            Komunikat: "Sprawdź email"
                      │
                      ▼
                   /login
```

## Stany komponentów

### LoginForm
```
┌─────────────┐
│   Default   │
│   State     │
└──────┬──────┘
       │
       │ submit
       ▼
┌─────────────┐
│  Loading    │
│  (spinner)  │
└──────┬──────┘
       │
       ├──► Błąd walidacji ──► Komunikat pod polem
       │
       ├──► Błąd API ──► Komunikat globalny (czerwony)
       │
       └──► Sukces ──► Przekierowanie do /generate (TODO)
```

### RegisterForm
```
┌─────────────┐
│   Default   │
│   State     │
└──────┬──────┘
       │
       │ submit
       ▼
┌─────────────┐
│  Loading    │
│  (spinner)  │
└──────┬──────┘
       │
       ├──► Błąd walidacji ──► Komunikat pod polem
       │
       ├──► Błąd API ──► Komunikat globalny (czerwony)
       │
       └──► Sukces ──► Ekran "Sprawdź email" (zielony)
                       │
                       └──► Button "Przejdź do logowania"
```

### ForgotPasswordForm
```
┌─────────────┐
│   Default   │
│   State     │
└──────┬──────┘
       │
       │ submit
       ▼
┌─────────────┐
│  Loading    │
│  (spinner)  │
└──────┬──────┘
       │
       ├──► Błąd walidacji ──► Komunikat pod polem
       │
       ├──► Błąd API ──► Komunikat globalny (czerwony)
       │
       └──► Sukces ──► Ekran "Link wysłany" (zielony)
                       │
                       └──► Button "Wróć do logowania"
```

### ResetPasswordForm
```
┌─────────────┐
│  Checking   │
│   Token     │
│  (spinner)  │
└──────┬──────┘
       │
       ├──► Token invalid ──► Ekran "Link wygasł" (czerwony)
       │                       │
       │                       └──► Button "Wyślij nowy link"
       │
       └──► Token valid
              │
              ▼
       ┌─────────────┐
       │   Default   │
       │   State     │
       └──────┬──────┘
              │
              │ submit
              ▼
       ┌─────────────┐
       │  Loading    │
       │  (spinner)  │
       └──────┬──────┘
              │
              ├──► Błąd walidacji ──► Komunikat pod polem
              │
              ├──► Błąd API ──► Komunikat globalny (czerwony)
              │
              └──► Sukces ──► Ekran "Hasło zmienione" (zielony)
                              │
                              └──► Button "Przejdź do logowania"
```

## Komunikaty użytkownika

### Komunikaty błędów (czerwone)

#### LoginForm
- "Email jest wymagany"
- "Wprowadź prawidłowy adres email"
- "Hasło jest wymagane"
- "Hasło musi mieć minimum 6 znaków"
- "Funkcjonalność logowania zostanie wkrótce dodana" (placeholder)

#### RegisterForm
- "Email jest wymagany"
- "Wprowadź prawidłowy adres email"
- "Hasło jest wymagane"
- "Hasło musi mieć minimum 8 znaków"
- "Hasło musi zawierać przynajmniej jedną wielką literę"
- "Hasło musi zawierać przynajmniej jedną cyfrę"
- "Hasło musi zawierać przynajmniej jeden znak specjalny"
- "Potwierdzenie hasła jest wymagane"
- "Hasła nie są identyczne"
- "Funkcjonalność rejestracji zostanie wkrótce dodana" (placeholder)

#### ForgotPasswordForm
- "Email jest wymagany"
- "Wprowadź prawidłowy adres email"
- "Funkcjonalność resetowania hasła zostanie wkrótce dodana" (placeholder)

#### ResetPasswordForm
- "Hasło jest wymagane"
- "Hasło musi mieć minimum 8 znaków"
- "Hasło musi zawierać przynajmniej jedną wielką literę"
- "Hasło musi zawierać przynajmniej jedną cyfrę"
- "Hasło musi zawierać przynajmniej jeden znak specjalny"
- "Potwierdzenie hasła jest wymagane"
- "Hasła nie są identyczne"
- "Link resetujący wygasł lub jest nieprawidłowy"
- "Funkcjonalność zmiany hasła zostanie wkrótce dodana" (placeholder)

### Komunikaty sukcesu (zielone)

#### RegisterForm (po sukcesie)
```
┌──────────────────────────────────────────────────────────┐
│ ✓ Konto zostało utworzone!                               │
│                                                           │
│ Sprawdź swoją skrzynkę email, aby zweryfikować adres.   │
│ Po weryfikacji będziesz mógł się zalogować.             │
└──────────────────────────────────────────────────────────┘
```

#### ForgotPasswordForm (po sukcesie)
```
┌──────────────────────────────────────────────────────────┐
│ ✓ Link do resetowania hasła został wysłany!             │
│                                                           │
│ Sprawdź swoją skrzynkę email na adres user@example.com. │
│ Kliknij w link, aby ustawić nowe hasło.                 │
│                                                           │
│ Link pozostanie aktywny przez 1 godzinę.                │
└──────────────────────────────────────────────────────────┘
```

#### ResetPasswordForm (po sukcesie)
```
┌──────────────────────────────────────────────────────────┐
│ ✓ Hasło zostało pomyślnie zmienione!                    │
│                                                           │
│ Możesz się teraz zalogować do swojego konta używając    │
│ nowego hasła.                                            │
└──────────────────────────────────────────────────────────┘
```

## Elementy UX

### Spinnery (loading states)
Wszystkie formularze pokazują loading podczas przetwarzania:
- Button zmienia tekst: "Logowanie...", "Tworzenie konta...", etc.
- Button zostaje disabled
- Wszystkie inputy zostają disabled
- Brak globalnego spinnera (w przeciwieństwie do GenerateView)

### Pomocnicze teksty
#### RegisterForm, ResetPasswordForm
Pod polem "Hasło":
```
Min. 8 znaków, wielka litera, cyfra i znak specjalny
```

### Linki
Wszystkie linki mają:
- `hover:underline`
- `text-primary` (główne linki) lub `text-muted-foreground` (pomocnicze)
- `transition-colors` dla płynności

### Responsywność
Karty mają:
- `w-full` w komponencie
- `max-w-md` w stronie Astro (ograniczenie szerokości)
- Padding `p-4` na zewnętrznym containerze

## Porównanie z istniejącymi komponentami

### GenerateView vs Auth Forms

| Aspekt | GenerateView | Auth Forms |
|--------|-------------|------------|
| Card layout | ✅ Identyczny | ✅ Identyczny |
| Button size | `lg` | `lg` |
| Error styling | Czerwone bg + border | Czerwone bg + border |
| Success styling | Zielone bg + border | Zielone bg + border |
| Loading state | Global overlay | Button disabled |
| Input component | Custom TextInput | Shadcn Input |

### Spójność stylistyczna
✅ Wszystkie auth formularze używają:
- Tych samych kolorów (`destructive`, `primary`, `muted-foreground`)
- Tych samych odstępów (`space-y-4`, `space-y-2`)
- Tych samych rozmiarów (`text-sm`, `text-2xl`)
- Tej samej typografii (`font-medium`, `font-bold`)

## Dostępność (a11y)

### Keyboard navigation
✅ Tab order:
1. Email input
2. Password input
3. (Link "Zapomniałeś hasła?")
4. Submit button
5. Link do innej strony

### Screen readers
✅ Każdy input:
- Ma `<label>` z `htmlFor`
- Ma `aria-invalid` gdy jest błąd
- Ma `aria-describedby` linkujące do error/help text

✅ Error messages:
- Mają `role="alert"`
- Są automatycznie czytane gdy się pojawią

## Testowanie (manualne)

### Scenariusz 1: Próba zalogowania z pustymi polami
1. Wejdź na `/login`
2. Kliknij "Zaloguj się" bez wypełniania pól
3. ✅ Powinny pojawić się błędy: "Email jest wymagany", "Hasło jest wymagane"

### Scenariusz 2: Nieprawidłowy format email
1. Wpisz "invalid-email" w pole email
2. Kliknij "Zaloguj się"
3. ✅ Powinien pojawić się błąd: "Wprowadź prawidłowy adres email"

### Scenariusz 3: Hasło zbyt krótkie (rejestracja)
1. Wejdź na `/register`
2. Wpisz email i hasło "Test1!"
3. Kliknij "Zarejestruj się"
4. ✅ Powinien pojawić się błąd: "Hasło musi mieć minimum 8 znaków"

### Scenariusz 4: Niezgodne hasła
1. Wpisz hasło "Test1234!"
2. Wpisz potwierdzenie "Different123!"
3. Kliknij "Zarejestruj się"
4. ✅ Powinien pojawić się błąd: "Hasła nie są identyczne"

### Scenariusz 5: Nawigacja między stronami
1. Wejdź na `/login`
2. Kliknij "Nie masz konta? Zarejestruj się"
3. ✅ Powinno przenieść na `/register`
4. Kliknij "Masz już konto? Zaloguj się"
5. ✅ Powinno wrócić na `/login`
6. Kliknij "Zapomniałeś hasła?"
7. ✅ Powinno przenieść na `/forgot-password`

### Scenariusz 6: Loading state
1. Wypełnij formularz prawidłowymi danymi
2. Kliknij submit
3. ✅ Button powinien pokazać "Logowanie..." i być disabled
4. ✅ Inputy powinny być disabled
5. ✅ Po 1 sekundzie powinien pojawić się komunikat placeholder

## Pliki utworzone

```
src/
├── components/
│   ├── LoginForm.tsx              ← NOWY (2.84 kB compiled)
│   ├── RegisterForm.tsx           ← NOWY (4.59 kB compiled)
│   ├── ForgotPasswordForm.tsx     ← NOWY (2.98 kB compiled)
│   └── ResetPasswordForm.tsx      ← NOWY (5.10 kB compiled)
└── pages/
    ├── login.astro                ← NOWY
    ├── register.astro             ← NOWY
    ├── forgot-password.astro      ← NOWY
    └── reset-password.astro       ← NOWY

.ai/
├── auth-spec.md                   (istniejący - specyfikacja)
├── auth-ui-implementation.md      ← NOWY (podsumowanie)
└── auth-ui-flow.md                ← NOWY (ten dokument)
```

## Gotowe do testowania

Aby przetestować UI lokalnie:

```bash
npm run dev
```

Następnie otwórz w przeglądarce:
- http://localhost:4321/login
- http://localhost:4321/register
- http://localhost:4321/forgot-password
- http://localhost:4321/reset-password

**Uwaga**: Funkcjonalność backendu nie jest jeszcze zaimplementowana, więc formularze nie będą faktycznie logować/rejestrować użytkowników. Wszystkie akcje pokazują komunikat placeholder.
