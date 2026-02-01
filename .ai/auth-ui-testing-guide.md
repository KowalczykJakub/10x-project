# Przewodnik Testowania UI - System Autentykacji

## 🚀 Jak uruchomić

Dev server jest już uruchomiony. Otwórz przeglądarkę i przejdź do:

### Strony autentykacji
- **Login**: http://localhost:4321/login
- **Rejestracja**: http://localhost:4321/register
- **Zapomniałem hasła**: http://localhost:4321/forgot-password
- **Reset hasła**: http://localhost:4321/reset-password

## ✅ Scenariusze testowe

### Test 1: Walidacja formularza logowania

**Kroki:**
1. Otwórz http://localhost:4321/login
2. Kliknij "Zaloguj się" BEZ wypełniania pól

**Oczekiwany rezultat:**
- ✅ Pod polem email: "Email jest wymagany"
- ✅ Pod polem hasło: "Hasło jest wymagane"
- ✅ Formularz NIE jest wysyłany

**Kolejny test:**
3. Wpisz email: `invalid-email`
4. Wpisz hasło: `12345`
5. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- ✅ Pod emailem: "Wprowadź prawidłowy adres email"
- ✅ Pod hasłem: "Hasło musi mieć minimum 6 znaków"

**Prawidłowe dane:**
6. Wpisz email: `test@example.com`
7. Wpisz hasło: `password123`
8. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- ✅ Button zmienia tekst na "Logowanie..."
- ✅ Button i inputy zostają disabled
- ✅ Po ~1 sekundzie: czerwony komunikat "Funkcjonalność logowania zostanie wkrótce dodana"

---

### Test 2: Walidacja formularza rejestracji

**Kroki:**
1. Otwórz http://localhost:4321/register
2. Wpisz email: `test@example.com`
3. Wpisz hasło: `test`
4. Wpisz potwierdzenie: `test`
5. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ Pod hasłem: "Hasło musi mieć minimum 8 znaków"

**Kolejny test:**
6. Wpisz hasło: `testtest`
7. Wpisz potwierdzenie: `testtest`
8. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ "Hasło musi zawierać przynajmniej jedną wielką literę"

**Kolejny test:**
9. Wpisz hasło: `TestTest`
10. Wpisz potwierdzenie: `TestTest`
11. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ "Hasło musi zawierać przynajmniej jedną cyfrę"

**Kolejny test:**
12. Wpisz hasło: `TestTest1`
13. Wpisz potwierdzenie: `TestTest1`
14. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ "Hasło musi zawierać przynajmniej jeden znak specjalny"

**Kolejny test:**
15. Wpisz hasło: `TestTest1!`
16. Wpisz potwierdzenie: `DifferentPass1!`
17. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ "Hasła nie są identyczne"

**Prawidłowe dane:**
18. Wpisz hasło: `TestTest1!`
19. Wpisz potwierdzenie: `TestTest1!`
20. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ Button "Tworzenie konta..."
- ✅ Po ~1s: komunikat placeholder
- (Po implementacji backendu: ekran sukcesu "Sprawdź email")

---

### Test 3: Zapomniałem hasła

**Kroki:**
1. Otwórz http://localhost:4321/forgot-password
2. Wpisz email: `test@example.com`
3. Kliknij "Wyślij link resetujący"

**Oczekiwany rezultat:**
- ✅ Button "Wysyłanie..."
- ✅ Po ~1s: komunikat placeholder
- (Po implementacji backendu: ekran sukcesu z instrukcjami)

---

### Test 4: Reset hasła

**Kroki:**
1. Otwórz http://localhost:4321/reset-password
2. Poczekaj na załadowanie

**Oczekiwany rezultat:**
- ✅ Spinner "Weryfikacja linku..."
- ✅ Po ~0.5s: formularz jest widoczny (token symulowany jako valid)

**Kolejny test:**
3. Wpisz nowe hasło: `NewTest1!`
4. Wpisz potwierdzenie: `NewTest1!`
5. Kliknij "Ustaw nowe hasło"

**Oczekiwany rezultat:**
- ✅ Button "Ustawianie hasła..."
- ✅ Po ~1s: komunikat placeholder
- (Po implementacji backendu: ekran sukcesu + button do logowania)

---

### Test 5: Nawigacja między stronami

**Kroki:**
1. Otwórz http://localhost:4321/login
2. Kliknij link "Nie masz konta? **Zarejestruj się**"

**Oczekiwany rezultat:**
- ✅ Przekierowanie do `/register`

**Kolejne kroki:**
3. Kliknij "Masz już konto? **Zaloguj się**"

**Oczekiwany rezultat:**
- ✅ Powrót do `/login`

**Kolejne kroki:**
4. Kliknij "**Zapomniałeś hasła?**"

**Oczekiwany rezultat:**
- ✅ Przekierowanie do `/forgot-password`

**Kolejne kroki:**
5. Kliknij "← **Wróć do logowania**"

**Oczekiwany rezultat:**
- ✅ Powrót do `/login`

---

### Test 6: Hover states i interaktywność

**Kroki:**
1. Na dowolnej stronie auth, najedź kursorem na linki

**Oczekiwany rezultat:**
- ✅ Linki podświetlają się (primary color)
- ✅ Pojawia się underline

**Kolejny test:**
2. Wypełnij formularz błędnymi danymi
3. Najedź na disabled button podczas loading

**Oczekiwany rezultat:**
- ✅ Kursor zmienia się na "not-allowed"
- ✅ Button nie zmienia koloru

---

### Test 7: Accessibility (keyboard navigation)

**Kroki:**
1. Otwórz http://localhost:4321/login
2. Użyj klawisza **Tab** do nawigacji

**Oczekiwana kolejność focusu:**
1. ✅ Pole Email
2. ✅ Pole Hasło
3. ✅ Link "Zapomniałeś hasła?"
4. ✅ Button "Zaloguj się"
5. ✅ Link "Zarejestruj się"

**Kolejny test:**
3. Wpisz błędny email i wciśnij **Enter**

**Oczekiwany rezultat:**
- ✅ Formularz się wysyła (submit na Enter działa)
- ✅ Pojawiają się błędy walidacji

---

### Test 8: Responsywność

**Kroki:**
1. Otwórz http://localhost:4321/login
2. Zmniejsz okno przeglądarki do szerokości mobile (~375px)

**Oczekiwany rezultat:**
- ✅ Karta pozostaje czytelna
- ✅ Nie ma horizontal scroll
- ✅ Padding jest odpowiedni (p-4)
- ✅ Logo i tagline są wycentrowane

**Kolejny test:**
3. Zwiększ okno do desktop (~1920px)

**Oczekiwany rezultat:**
- ✅ Karta ma max-width (max-w-md)
- ✅ Pozostaje wycentrowana
- ✅ Nie rozciąga się na całą szerokość

---

### Test 9: Wizualna spójność

**Kroki:**
1. Porównaj strony autentykacji z istniejącymi stronami (np. `/generate`)

**Sprawdź:**
- ✅ Kolory są identyczne (primary, destructive, muted-foreground)
- ✅ Karty mają ten sam styl (border, shadow, border-radius)
- ✅ Buttony mają ten sam rozmiar i styl
- ✅ Inputy mają ten sam styl (border, focus ring)
- ✅ Komunikaty błędów mają ten sam styl (czerwone tło)
- ✅ Typografia jest spójna (font-size, font-weight)

---

## 🔍 Sprawdzenie w Developer Tools

### Console
**Kroki:**
1. Otwórz DevTools (F12)
2. Przejdź do zakładki Console
3. Wypełnij formularz logowania i wyślij

**Oczekiwany rezultat w console:**
```
Login attempt: { email: 'test@example.com', password: '***' }
```

**Sprawdź:**
- ✅ Hasło jest zamaskowane (`'***'`) - bezpieczeństwo!
- ✅ Brak błędów w konsoli
- ✅ Brak warningów React

---

### Network
**Kroki:**
1. Przejdź do zakładki Network
2. Wyślij formularz

**Oczekiwany rezultat:**
- ✅ Brak requestów HTTP (backend nie jest jeszcze zaimplementowany)
- ✅ Brak błędów 404 dla zasobów (CSS, JS)

---

### Lighthouse (opcjonalnie)

**Kroki:**
1. Otwórz DevTools → Lighthouse
2. Wybierz "Accessibility"
3. Kliknij "Generate report"

**Oczekiwane wyniki:**
- ✅ Accessibility score: >90
- ✅ Wszystkie inputy mają labels
- ✅ Kontrast kolorów jest odpowiedni
- ✅ ARIA attributes są poprawne

---

## 🐛 Known Issues (oczekiwane)

### Placeholder messages
Wszystkie formularze pokazują komunikat:
```
"Funkcjonalność X zostanie wkrótce dodana"
```

**To jest OCZEKIWANE** - backend nie jest jeszcze zaimplementowany.

### Brak faktycznego logowania
Po kliknięciu "Zaloguj się" użytkownik NIE jest przekierowywany do `/generate`.

**To jest OCZEKIWANE** - implementacja backendu będzie w następnym etapie.

### Token resetowania hasła
W `/reset-password` token jest symulowany jako valid.

**To jest OCZEKIWANE** - faktyczna weryfikacja tokenu będzie po implementacji Supabase.

---

## 📸 Screenshots checklist

Jeśli chcesz zrobić screenshots dla dokumentacji:

- [ ] `/login` - stan domyślny
- [ ] `/login` - z błędami walidacji
- [ ] `/login` - stan loading
- [ ] `/register` - stan domyślny
- [ ] `/register` - z błędami walidacji
- [ ] `/register` - ekran sukcesu (TODO po implementacji backendu)
- [ ] `/forgot-password` - stan domyślny
- [ ] `/forgot-password` - ekran sukcesu (TODO)
- [ ] `/reset-password` - spinner ładowania tokenu
- [ ] `/reset-password` - formularz
- [ ] `/reset-password` - ekran "link wygasł" (TODO: wymaga symulacji błędu)
- [ ] `/reset-password` - ekran sukcesu (TODO)

---

## ✅ Checklist końcowy

Po zakończeniu testów, upewnij się że:

- [ ] Wszystkie 4 strony ładują się poprawnie
- [ ] Walidacja działa na wszystkich formularzach
- [ ] Loading states są widoczne
- [ ] Nawigacja między stronami działa
- [ ] Nie ma błędów w konsoli
- [ ] Accessibility jest zachowane (keyboard nav, ARIA)
- [ ] Styling jest spójny z resztą aplikacji
- [ ] Responsive design działa (mobile + desktop)

---

## 🎉 Co dalej?

Po pozytywnych testach UI, kolejne kroki (poza zakresem tego taska):

1. **Backend**: Implementacja middleware autentykacji
2. **Supabase**: Konfiguracja i integracja
3. **API**: Endpointy `/api/auth/logout` i `/api/auth/delete-account`
4. **Modyfikacje**: Aktualizacja Sidebar i ProfileView
5. **Testowanie**: E2E testy z faktycznym backendem

---

Dokument utworzony: 2026-02-01  
Status: ✅ Gotowe do testowania manualnego
