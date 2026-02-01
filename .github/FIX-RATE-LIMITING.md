# 🔧 Naprawiono: Rate Limiting w Testach API

## ❌ Problem

Testy API w CI nie przechodziły z powodu:
1. **Rate limiting** - Supabase produkcja ma limit 30 sign_in/sign_ups per 5 minut per IP
2. **Email confirmation** - może być włączona w produkcji, blokując logowanie

### Błędy:
```
"Zbyt wiele prób. Spróbuj ponownie później."
"Nieprawidłowy adres email"
```

---

## ✅ Rozwiązanie

### 1. Współdzielony użytkownik testowy w CI

**Zmiana**: Zamiast tworzyć nowego użytkownika dla każdego testu, używamy jednego współdzielonego użytkownika w CI.

**Pliki zmienione**:
- `tests/api/global-setup.ts` (nowy) - tworzy współdzielonego użytkownika
- `tests/api/setup.ts` - używa współdzielonego użytkownika gdy `CI=true`
- `tests/api/auth.test.ts` - pomija test tworzenia użytkownika w CI
- `vitest.api.config.ts` - dodano global setup i sekwencyjne wykonywanie testów

**Użytkownik CI**:
```typescript
email: "ci-test-user@example.com"
password: "Test123!@#SecurePassword"
```

---

### 2. Sekwencyjne wykonywanie testów

**Zmiana**: Testy API wykonują się po kolei (nie równolegle), żeby unikać przekroczenia rate limitu.

```typescript
// vitest.api.config.ts
sequence: {
  concurrent: false,
},
pool: "forks",
poolOptions: {
  forks: {
    singleFork: true,
  },
},
```

---

## ⚙️ Konfiguracja Supabase (Wymagane!)

### MUSISZ wyłączyć email confirmation w produkcji:

1. Przejdź do: https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/auth/settings

2. Znajdź sekcję **"Email Auth"**

3. **Wyłącz**:
   - ✅ "Enable email confirmations" → **OFF** (false)
   - ✅ "Enable double confirmation for email changes" → **OFF** (opcjonalne)

4. Zapisz zmiany

**Dlaczego?**
- W testach CI nie mamy dostępu do skrzynki email
- Bez wyłączenia confirmation, użytkownicy nie mogą się zalogować
- Lokalnie Supabase ma to domyślnie wyłączone

---

## 📊 Jak to działa

### W CI (GitHub Actions):
```
1. Global Setup uruchamia się raz
   └─ Tworzy ci-test-user@example.com

2. Każdy test używa tego samego użytkownika
   ├─ auth.test.ts - pomija test rejestracji
   ├─ flashcards.test.ts - używa ci-test-user
   └─ generations.test.ts - używa ci-test-user

3. Testy wykonują się sekwencyjnie
   └─ Unikamy rate limitingu
```

### Lokalnie (development):
```
1. Każdy test tworzy unikalnego użytkownika
   └─ test-1234567890-abc123@example.com

2. Nie ma problemu z rate limitingiem
   └─ Lokalna baza Supabase bez limitów
```

---

## 🚀 Weryfikacja

### Test lokalnie:
```bash
# Windows
.\scripts\test-api-with-server.ps1

# Linux/Mac
chmod +x scripts/test-api-with-server.sh
./scripts/test-api-with-server.sh
```

### Test w CI:
Po pushu zmian, sprawdź workflow:
```
GitHub → Actions → CI → test-api job
```

Powinno pokazać:
```
✅ Global Setup: Creating shared test user
✅ API Tests: All tests pass
```

---

## ✅ Checklist przed pushem

- [ ] Wyłączono "Enable email confirmations" w Supabase
- [ ] Wszystkie sekrety są w GitHub (SUPABASE_SERVICE_ROLE_KEY!)
- [ ] Testy przechodzą lokalnie
- [ ] Rate limiting nie blokuje (1 użytkownik w CI)

---

## 🆘 Troubleshooting

### "Email already registered"
→ OK! To znaczy że współdzielony użytkownik już istnieje (global setup zadziałał)

### "Invalid email or password" w login test
→ Sprawdź czy email confirmation jest wyłączone w Supabase

### Nadal "Too many requests"
→ Sprawdź czy testy wykonują się sekwencyjnie (pool: forks, singleFork: true)

### Test registration fails in CI
→ To oczekiwane - test jest pomijany w CI (console log: "Skipping...")

---

## 📚 Więcej informacji

- Supabase Rate Limits: https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits
- Vitest Global Setup: https://vitest.dev/config/#globalsetup
