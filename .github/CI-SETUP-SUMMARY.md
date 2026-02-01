# 🔧 CI/CD Setup - Podsumowanie Zmian

## ✅ Co zostało naprawione

### 1. Zmienne środowiskowe w workflow
**Problem**: Aplikacja oczekiwała `SUPABASE_KEY`, ale workflow przekazywał `SUPABASE_ANON_KEY`

**Rozwiązanie**:
```yaml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_KEY: ${{ secrets.SUPABASE_ANON_KEY }}  # ✅ Zmapowane poprawnie
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

### 2. Testy API wymagają działającego serwera
**Problem**: Testy API próbowały połączyć się z `localhost:3000`, ale serwer nie był uruchomiony

**Rozwiązanie** - Job `test-api`:
1. ✅ Build aplikacji (`npm run build`)
2. ✅ Uruchomienie preview w tle na porcie 3000
3. ✅ Oczekiwanie na gotowość serwera (curl check)
4. ✅ Uruchomienie testów API
5. ✅ Zatrzymanie serwera po testach

```yaml
- name: Build application
  run: npm run build

- name: Start server in background
  run: |
    PORT=3000 npm run preview -- --port 3000 &
    echo $! > server.pid
    sleep 5

- name: Wait for server to be ready
  run: |
    timeout 30 bash -c 'until curl -f http://localhost:3000 > /dev/null 2>&1; do sleep 1; done' || exit 1

- name: Run API tests
  run: npm run test:api

- name: Stop server
  if: always()
  run: |
    if [ -f server.pid ]; then
      kill $(cat server.pid) || true
    fi
```

---

### 3. Testy E2E - Playwright auto-start
**Odkrycie**: Playwright już ma skonfigurowany `webServer` w `playwright.config.ts`, więc automatycznie uruchamia serwer.

**Akcja**: Zostawiono oryginalny prosty workflow - Playwright sam zarządza serwerem.

---

## 🔐 Wymagane GitHub Secrets

Upewnij się, że masz dodane w GitHub (`Settings → Secrets → Actions`):

| Secret Name | Przykład | Gdzie pobrać |
|-------------|----------|--------------|
| `SUPABASE_URL` | `https://weccqjwtlzelsmawkmnb.supabase.co` | Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` | Dashboard → Settings → API → anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Dashboard → Settings → API → service_role |
| `SUPABASE_ACCESS_TOKEN` | `sbp_...` | Dashboard → Account → Tokens |
| `SUPABASE_DB_PASSWORD` | `3m!fvFhB!!f3GW6` | Hasło do bazy |
| `SUPABASE_PROJECT_ID` | `weccqjwtlzelsmawkmnb` | Dashboard → Settings → General |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | (Opcjonalny) OpenRouter dashboard |

---

## 📊 Struktura Workflow

```
CI Pipeline
├── 1. Lint (zawsze)
├── 2. Unit Tests (zawsze)
├── 3. API Tests (wymaga serwera)
│   ├── Build → Preview → Testy
│   └── Zatrzymanie serwera
├── 4. E2E Tests (Playwright auto-start)
│   └── Playwright uruchamia serwer automatycznie
└── 5. Build (wymaga: lint, unit, api)
    └── Artefakty do deployment
```

---

## 🚀 Jak to przetestować

### Lokalnie:
```bash
# Test połączenia z bazą
npm run test:db

# Testy jednostkowe
npm run test:unit

# Testy API (wymaga uruchomionego serwera w innym terminalu)
# Terminal 1:
npm run dev
# Terminal 2:
npm run test:api

# Testy E2E (Playwright sam uruchomi serwer)
npm run test:e2e
```

### W GitHub Actions:
1. Dodaj wszystkie sekrety (lista powyżej)
2. Pushuj kod:
   ```bash
   git add .
   git commit -m "Fix CI pipeline for production database"
   git push
   ```
3. Sprawdź w GitHub → Actions

---

## ✅ Checklist przed pushem

- [ ] Wszystkie sekrety dodane w GitHub
- [ ] `.env` lokalnie skonfigurowany (NIE commitować!)
- [ ] Testy przechodzą lokalnie
- [ ] Migracje uruchomione na produkcji
- [ ] `SUPABASE_SERVICE_ROLE_KEY` pobrany z dashboardu

---

## 🆘 Troubleshooting

### "Cannot connect to SUPABASE"
→ Sprawdź czy `SUPABASE_URL` i `SUPABASE_ANON_KEY` są poprawne

### "Server not responding" w testach API
→ Sprawdź logi build step - czy aplikacja się zbudowała poprawnie

### "Migration errors"
→ Uruchom migracje ręcznie: `npx supabase db push`

### "Too many requests" / Rate limiting w testach
→ Zobacz: `.github/FIX-RATE-LIMITING.md`
→ Upewnij się że email confirmation jest wyłączone w Supabase
→ Testy API używają współdzielonego użytkownika w CI

### Testy przechodzą lokalnie, ale nie w CI
→ Sprawdź czy wszystkie sekrety są dodane w GitHub
→ Sprawdź logi każdego step w Actions
→ Sprawdź czy email confirmation jest wyłączone

---

## 📚 Dokumenty powiązane

- `.github/SECRETS-SETUP.md` - Szczegółowy guide po secretach
- `.github/workflows/README.md` - Dokumentacja workflows
- `QUICKSTART.md` - Quick start guide
- `SETUP-PRODUCTION.md` - Setup produkcyjnej bazy
