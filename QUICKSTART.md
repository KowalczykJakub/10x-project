# ⚡ Quick Start - Konfiguracja Produkcyjnej Bazy Supabase

## 🎯 Cel
Podłączenie aplikacji do produkcyjnej bazy danych Supabase zamiast lokalnej.

---

## 📝 Szybkie Kroki

### 1️⃣ Pobierz klucze API z Supabase

Przejdź do: **https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/settings/api**

Skopiuj:
- **Project URL** (powinien być gotowy: `https://weccqjwtlzelsmawkmnb.supabase.co`)
- **anon public** - długi token `eyJ...`
- **service_role** - inny długi token `eyJ...` (⚠️ sekret!)

### 2️⃣ Pobierz Supabase Access Token (dla CLI)

Przejdź do: **https://supabase.com/dashboard/account/tokens**

Kliknij **"Generate new token"** i skopiuj (zaczyna się od `sbp_...`)

⚠️ **Uwaga**: Token pokazuje się tylko RAZ! Zapisz go zaraz.

### 3️⃣ Utwórz plik `.env` lokalnie

```bash
# Windows PowerShell
Copy-Item .env.local.template .env

# Lub Linux/Mac
cp .env.local.template .env
```

### 4️⃣ Wypełnij `.env` swoimi kluczami

Otwórz plik `.env` i podmień:

```bash
# Wklej swoje wartości
PUBLIC_SUPABASE_URL=https://weccqjwtlzelsmawkmnb.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ_TUTAJ_TWÓJ_ANON_KEY

SUPABASE_URL=https://weccqjwtlzelsmawkmnb.supabase.co
SUPABASE_KEY=eyJ_TUTAJ_TWÓJ_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJ_TUTAJ_TWÓJ_SERVICE_ROLE_KEY

DATABASE_URL=postgresql://postgres:3m!fvFhB!!f3GW6@db.weccqjwtlzelsmawkmnb.supabase.co:5432/postgres

SUPABASE_ACCESS_TOKEN=sbp_TUTAJ_TWÓJ_ACCESS_TOKEN
SUPABASE_PROJECT_ID=weccqjwtlzelsmawkmnb

# Opcjonalnie (jeśli masz)
OPENROUTER_API_KEY=sk-or-v1-...

NODE_ENV=development
```

💾 **Zapisz plik**

### 5️⃣ Zainstaluj dotenv (jeśli nie masz)

```bash
npm install dotenv
```

### 6️⃣ Przetestuj połączenie

```bash
node scripts/test-db-connection.js
```

Jeśli zobaczysz:
```
⚠️ Tabela "flashcards" nie istnieje - musisz uruchomić migracje!
```

To przejdź do kroku 7 ⬇️

### 7️⃣ Uruchom migracje na produkcji

#### Opcja A: Przez Supabase CLI (zalecane)

```bash
# Zaloguj się (otworzy przeglądarkę)
npx supabase login

# Linkuj projekt
npx supabase link --project-ref weccqjwtlzelsmawkmnb
# Gdy zapyta o hasło: 3m!fvFhB!!f3GW6

# Sprawdź status migracji
npx supabase db remote status

# Uruchom migracje
npx supabase db push

# Sprawdź czy wszystko OK
npx supabase db remote status
```

#### Opcja B: Ręcznie przez Dashboard

1. Przejdź do: https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/editor
2. Otwórz **SQL Editor**
3. Skopiuj zawartość pliku `supabase/migrations/20250115120000_create_10xcards_schema.sql`
4. Wklej i kliknij **Run**
5. Powtórz dla `20250115120001_disable_rls_policies.sql`

### 8️⃣ Zweryfikuj czy migracje zadziałały

```bash
node scripts/test-db-connection.js
```

Powinno pokazać:
```
✅ Tabela "flashcards" istnieje
✅ Tabela "generations" istnieje
✅ Tabela "generation_error_logs" istnieje
📊 Statystyki bazy:
   - Flashcards: 0
   - Generations: 0
✅ Wszystkie testy przeszły pomyślnie!
🎉 Baza danych jest gotowa do użycia!
```

### 9️⃣ Uruchom aplikację

```bash
npm run dev
```

Aplikacja teraz działa z **produkcyjną bazą Supabase**! 🎉

---

## 🔐 Konfiguracja GitHub Actions (opcjonalne)

Aby automatycznie uruchamiać migracje w CI/CD:

1. Przejdź do swojego repo na GitHub
2. Settings → Secrets and variables → Actions
3. Dodaj sekrety (kliknij **New repository secret**):

| Secret | Wartość |
|--------|---------|
| `SUPABASE_URL` | `https://weccqjwtlzelsmawkmnb.supabase.co` |
| `SUPABASE_ANON_KEY` | Twój anon key `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Twój service_role key `eyJ...` |
| `SUPABASE_ACCESS_TOKEN` | Twój CLI token `sbp_...` |
| `SUPABASE_DB_PASSWORD` | `3m!fvFhB!!f3GW6` |
| `SUPABASE_PROJECT_ID` | `weccqjwtlzelsmawkmnb` |
| `OPENROUTER_API_KEY` | Twój OpenRouter key (opcjonalne) |

4. Teraz możesz uruchomić workflow:
   - Przejdź do **Actions**
   - Wybierz **"Database Migrations"**
   - Kliknij **"Run workflow"**

---

## 🆘 Coś nie działa?

### Błąd: "Invalid API key"
- Sprawdź czy skopiowałeś cały klucz (bez spacji na początku/końcu)
- Wygeneruj nowy klucz w dashboardzie

### Błąd: "Cannot connect"
- Sprawdź czy masz internet
- Sprawdź czy URL jest poprawny: `https://weccqjwtlzelsmawkmnb.supabase.co`

### Błąd: "Table already exists"
- Znaczy że migracje już są uruchomione - to dobrze! ✅
- Możesz pominąć ten błąd

### Potrzebujesz więcej pomocy?
Sprawdź szczegółową dokumentację w `SETUP-PRODUCTION.md`

---

## 📚 Co dalej?

✅ Baza produkcyjna skonfigurowana  
✅ Migracje uruchomione  
✅ Aplikacja działa lokalnie z produkcyjną bazą  

Możesz teraz:
- Dodać dane testowe przez aplikację
- Skonfigurować deployment (Vercel, Netlify, itp.)
- Ustawić automatyczne migracje w CI/CD
- Dodać nowe funkcje do aplikacji

**Dokumentacja:**
- `SETUP-PRODUCTION.md` - szczegółowy guide
- `.github/workflows/README.md` - informacje o CI/CD
- `DEPLOYMENT.md` - deployment aplikacji
