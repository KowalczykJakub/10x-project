# 🚀 Setup Produkcyjnej Bazy Danych Supabase

## 📋 Przygotowanie

Twój projekt Supabase: https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb

### Krok 1: Pobierz dane dostępowe z Dashboardu

#### 1.1 API Keys
Przejdź do: https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/settings/api

Skopiuj:
- **Project URL**: `https://weccqjwtlzelsmawkmnb.supabase.co`
- **anon/public key**: Długi token zaczynający się od `eyJ...`
- **service_role key**: Inny długi token (⚠️ **TRZYMAJ W SEKRECIE!**)

#### 1.2 Supabase Access Token (dla CLI)
Przejdź do: https://supabase.com/dashboard/account/tokens

Kliknij **"Generate new token"** i skopiuj token (zaczyna się od `sbp_...`)

⚠️ **UWAGA**: Ten token pokazuje się tylko raz! Zapisz go od razu.

---

## 🔧 Konfiguracja Lokalna

### Krok 2: Utwórz plik `.env`

Skopiuj template i wypełnij brakujące wartości:

```bash
cp .env.local.template .env
```

Następnie edytuj `.env` i wklej swoje klucze API:
- Zastąp `eyJ...` w `PUBLIC_SUPABASE_ANON_KEY` swoim anon key
- Zastąp `eyJ...` w `SUPABASE_SERVICE_ROLE_KEY` swoim service_role key
- Zastąp `sbp_...` w `SUPABASE_ACCESS_TOKEN` swoim access tokenem
- Dodaj swój `OPENROUTER_API_KEY` jeśli masz

**Plik `.env` jest w `.gitignore` - NIE commituj go do repozytorium!**

---

## 🗄️ Uruchomienie Migracji na Produkcji

### Opcja A: Używając Supabase CLI (Zalecane)

#### 1. Zaloguj się do Supabase

```bash
npx supabase login
```

To otworzy przeglądarkę do logowania.

**LUB** użyj access tokena:

```bash
$env:SUPABASE_ACCESS_TOKEN="twój-token-sbp_..."  # PowerShell
# lub
export SUPABASE_ACCESS_TOKEN="twój-token-sbp_..." # Bash/Linux
```

#### 2. Linkuj projekt lokalny z produkcyjnym

```bash
npx supabase link --project-ref weccqjwtlzelsmawkmnb
```

Gdy zapyta o hasło do bazy, wpisz: `3m!fvFhB!!f3GW6`

#### 3. Sprawdź status migracji

```bash
npx supabase db remote status
```

Pokaże Ci które migracje są już zastosowane, a które czekają.

#### 4. Uruchom migracje

```bash
npx supabase db push
```

To zastosuje wszystkie migracje z folderu `supabase/migrations/` na produkcyjnej bazie.

#### 5. Zweryfikuj

```bash
npx supabase db remote status
```

Wszystkie migracje powinny być oznaczone jako zastosowane ✅

---

### Opcja B: Używając Supabase Dashboard (Alternatywa)

Jeśli CLI nie działa, możesz uruchomić migracje ręcznie:

1. Przejdź do: https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/editor
2. Otwórz **SQL Editor**
3. Skopiuj i wklej zawartość każdego pliku z `supabase/migrations/`:
   - `20250115120000_create_10xcards_schema.sql`
   - `20250115120001_disable_rls_policies.sql`
4. Wykonaj każdy skrypt po kolei (kliknij **Run**)

---

## 🔐 Konfiguracja GitHub Secrets (dla CI/CD)

Aby pipeline automatycznie działał z produkcyjną bazą, dodaj sekrety w GitHub:

**Przejdź do:** `https://github.com/TWOJ-USERNAME/TWOJ-REPO/settings/secrets/actions`

Dodaj następujące sekrety (kliknij **"New repository secret"**):

| Secret Name | Wartość | Gdzie znaleźć |
|-------------|---------|---------------|
| `SUPABASE_URL` | `https://weccqjwtlzelsmawkmnb.supabase.co` | Settings → API |
| `SUPABASE_ANON_KEY` | `eyJ...` (anon key) | Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role key) | Settings → API |
| `DATABASE_URL` | `postgresql://postgres:3m!fvFhB!!f3GW6@db.weccqjwtlzelsmawkmnb.supabase.co:5432/postgres` | Pełny connection string |
| `SUPABASE_ACCESS_TOKEN` | `sbp_...` | Account → Access Tokens |
| `SUPABASE_PROJECT_ID` | `weccqjwtlzelsmawkmnb` | Settings → General → Reference ID |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Twój OpenRouter API key |

---

## ✅ Testowanie Połączenia

Po skonfigurowaniu wszystkiego, przetestuj czy aplikacja działa z produkcyjną bazą:

```bash
# Załaduj zmienne środowiskowe
cat .env  # Sprawdź czy wszystko jest OK

# Uruchom aplikację lokalnie
npm run dev
```

Aplikacja powinna teraz łączyć się z **produkcyjną bazą Supabase** zamiast lokalnej!

---

## 🔄 Workflow: Dodawanie Nowych Migracji

Gdy będziesz chciał dodać nowe zmiany do bazy:

```bash
# 1. Utwórz nową migrację
npx supabase migration new add_new_feature

# 2. Edytuj plik w supabase/migrations/
# Dodaj swoje SQL polecenia

# 3. Przetestuj lokalnie (jeśli masz lokalny Supabase)
npx supabase db reset

# 4. Wrzuć na produkcję
npx supabase db push

# 5. Commituj i pushuj do GitHub
git add supabase/migrations/
git commit -m "Add new migration: add_new_feature"
git push
```

---

## 🆘 Troubleshooting

### Błąd: "Cannot connect to database"
- Sprawdź czy hasło jest poprawne: `3m!fvFhB!!f3GW6`
- Sprawdź Network Restrictions w: Settings → Database → Network
- Upewnij się że masz dostęp do internetu

### Błąd: "Migration already applied"
To OK! Znaczy że migracja już działa na produkcji.

### Błąd: "relation already exists"
Tabele już istnieją w bazie. Możesz:
- Usunąć tabele ręcznie przez SQL Editor
- LUB zacząć od nowej migracji która sprawdza `IF NOT EXISTS`

### Resetowanie bazy (⚠️ UWAGA: Usuwa wszystkie dane!)
```bash
npx supabase db remote reset
```

---

## 📚 Przydatne Linki

- **Dashboard projektu**: https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb
- **SQL Editor**: https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/editor
- **API Settings**: https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/settings/api
- **Database Settings**: https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/settings/database
- **Access Tokens**: https://supabase.com/dashboard/account/tokens
- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
