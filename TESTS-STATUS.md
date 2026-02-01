# Status Testów - 10x-Cards MVP

## ✅ Działające Testy

### Testy Jednostkowe (35 testów) - **GOTOWE** ✅

```bash
npm run test:unit
```

**Status**: Wszystkie testy przechodzą ✓

```
✓ src/lib/utils/crypto.test.ts (7 tests)
✓ src/lib/schemas/generation.schema.test.ts (4 tests)  
✓ src/lib/schemas/auth.schema.test.ts (12 tests)
✓ src/lib/services/openrouter.service.test.ts (12 tests)

Test Files  4 passed (4)
     Tests  35 passed (35)
```

**Coverage**: 
- `auth.schema.ts` - 88.88%
- `generation.schema.ts` - 100%
- `crypto.ts` - 100%
- `openrouter.service.ts` - 20.17% (inicjalizacja i walidacja testowane)

---

## ⏳ Testy Wymagające Serwera

### Testy API (21 testów) - **100% ZALICZONE** ✅

**Wymagania**: Serwer dev musi działać + Supabase (port 3000)

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:api
```

**Wynik**:
```
✅ Test Files  3 passed (3)
✅ Tests  21 passed (21)
```

**Pliki testowe**:
- ✅ `tests/api/auth.test.ts` - 7 testów ✅
- ✅ `tests/api/flashcards.test.ts` - 9 testów ✅
- ✅ `tests/api/generations.test.ts` - 5 testów ✅

**Status**: 100% testów zaliczonych! 🎉

---

### Testy E2E (14 testów) - **GOTOWE**

**Wymagania**: Serwer dev + Supabase + OpenRouter API

```bash
npm run test:e2e:ui      # tryb interaktywny
npm run test:e2e:headed  # z widoczną przeglądarką
npm run test:e2e         # headless
```

**Pliki testowe gotowe**:
- ✅ `tests/e2e/auth.spec.ts` - 3 testy (flow autentykacji)
- ✅ `tests/e2e/generate.spec.ts` - 3 testy (generowanie AI)
- ✅ `tests/e2e/flashcards.spec.ts` - 5 testów (zarządzanie)
- ✅ `tests/e2e/study.spec.ts` - 3 testy (sesje nauki)

**Status**: Gotowe do uruchomienia (Playwright automatycznie uruchomi serwer)

---

## 📊 Podsumowanie

| Typ Testów | Liczba | Status | Wymaga Serwera |
|------------|--------|--------|----------------|
| **Unit** | 35 | ✅ 100% | ❌ Nie |
| **API** | 21 | ✅ 100% | ✅ Tak (port 3000) |
| **E2E** | 14 | ⏳ Gotowe | ✅ Tak |
| **RAZEM** | **70** | **56 działa (100%) + 14 gotowych** | - |

---

## 🚀 Quick Start

### 1. Testy bez serwera (najszybsze)

```bash
npm run test:unit
```

**Wynik**: ✅ 35/35 testów w ~300ms (100%)

### 2. Testy z serwerem (pełne)

```bash
# Uruchom serwer (Terminal 1)
npm run dev

# Sprawdź czy działa
curl http://localhost:3000

# W osobnym terminalu (Terminal 2)
npm run test:api

# E2E (automatycznie uruchomi serwer)
npm run test:e2e
```

---

## ⚠️ Wymagania dla testów z serwerem

### 1. Supabase musi działać

```bash
supabase status

# Jeśli nie działa
supabase start
```

### 2. Zmienne środowiskowe

Upewnij się że `.env` zawiera:
```env
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
OPENROUTER_API_KEY=...
```

### 3. Port 3000 musi być wolny

```bash
# Windows
netstat -ano | findstr :3000

# Jeśli zajęty, zabij proces lub zmień port w astro.config.mjs
```

---

## 🐛 Troubleshooting

### Błąd: `ECONNREFUSED`

**Problem**: Serwer nie działa

**Rozwiązanie**:
```bash
# Sprawdź czy serwer działa
npm run dev

# W osobnym terminalu - sprawdź połączenie
curl http://localhost:3000
```

### Błąd: Playwright timeout

**Problem**: Serwer nie startuje w 120s

**Możliwe przyczyny**:
1. Brak Supabase: `supabase start`
2. Brak `.env`
3. Błąd w kodzie aplikacji

**Debug**:
```bash
# Sprawdź czy serwer startuje manualnie
npm run dev

# Zobacz logi błędów
```

### Testy jednostkowe failują

**Problem**: Błędy w testach unit

**Rozwiązanie**:
```bash
# Wyczyść node_modules i zainstaluj ponownie
rm -rf node_modules
npm install

# Sprawdź czy vitest działa
npx vitest --version
```

---

## 📈 Następne Kroki

1. ✅ **ZROBIONE**: Testy jednostkowe działają
2. ⏳ **DO ZROBIENIA**: Uruchom serwer i przetestuj API tests
3. ⏳ **DO ZROBIENIA**: Przetestuj E2E z działającą aplikacją
4. 🎯 **CEL**: ✅ 56/70 testów zaliczonych (80%)

---

## 💡 Dobre praktyki

- **Podczas developmentu**: Uruchamiaj `npm test` (watch mode)
- **Przed commitem**: Uruchom `npm run test:unit`
- **Przed merge**: Uruchom pełny zestaw z serwerem
- **W CI/CD**: Wszystkie testy z Supabase w kontenerze

---

**Ostatnia aktualizacja**: 2026-02-01
**Implementacja**: Vitest + Playwright
**Status**: ✅ 56/70 testów działa (80%), pozostałe 14 gotowe do uruchomienia
