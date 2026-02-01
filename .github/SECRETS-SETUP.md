# 🔐 GitHub Secrets - Instrukcja Konfiguracji

## Twój Projekt Supabase
**Project URL**: https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb  
**Project Reference ID**: `weccqjwtlzelsmawkmnb`

---

## 📝 Lista Sekretów do Dodania

Przejdź do swojego repozytorium na GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

### 1. SUPABASE_URL
**Wartość**: `https://weccqjwtlzelsmawkmnb.supabase.co`

**Gdzie znaleźć**:  
Dashboard → Settings → API → Project URL

---

### 2. SUPABASE_ANON_KEY
**Wartość**: `eyJ...` (długi token)

**Gdzie znaleźć**:  
Dashboard → Settings → API → Project API keys → **anon** / **public**

Skopiuj cały token (rozpoczyna się od `eyJ`, ma ~200+ znaków)

⚠️ **UWAGA**: W GitHub dodaj jako `SUPABASE_ANON_KEY`, ale workflow automatycznie mapuje to na `SUPABASE_KEY` używaną przez aplikację.

---

### 3. SUPABASE_SERVICE_ROLE_KEY
**Wartość**: `eyJ...` (inny długi token)

**Gdzie znaleźć**:  
Dashboard → Settings → API → Project API keys → **service_role**

⚠️ **UWAGA**: To sekretny klucz z pełnymi uprawnieniami! Nie udostępniaj go nigdzie.

---

### 4. SUPABASE_ACCESS_TOKEN
**Wartość**: `sbp_...` (token CLI)

**Gdzie znaleźć**:  
https://supabase.com/dashboard/account/tokens

1. Kliknij **"Generate new token"**
2. Nazwij go np. "GitHub Actions"
3. Skopiuj token (pokazuje się tylko raz!)

Token zaczyna się od `sbp_` i ma ~40+ znaków.

---

### 5. SUPABASE_DB_PASSWORD
**Wartość**: `3m!fvFhB!!f3GW6`

To hasło do bazy PostgreSQL, które już masz.

---

### 6. SUPABASE_PROJECT_ID
**Wartość**: `weccqjwtlzelsmawkmnb`

**Gdzie znaleźć**:  
Dashboard → Settings → General → Reference ID

Lub po prostu ostatnia część URL dashboardu.

---

### 7. OPENROUTER_API_KEY (Opcjonalny)
**Wartość**: `sk-or-v1-...`

Jeśli używasz OpenRouter do generowania fiszek AI, dodaj swój klucz API.

**Gdzie znaleźć**:  
https://openrouter.ai/keys

---

## ✅ Checklist

Po dodaniu wszystkich sekretów, upewnij się że:

- [ ] `SUPABASE_URL` - zawiera pełny URL z `https://`
- [ ] `SUPABASE_ANON_KEY` - zaczyna się od `eyJ`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - zaczyna się od `eyJ` (inny niż anon)
- [ ] `SUPABASE_ACCESS_TOKEN` - zaczyna się od `sbp_`
- [ ] `SUPABASE_DB_PASSWORD` - dokładnie: `3m!fvFhB!!f3GW6`
- [ ] `SUPABASE_PROJECT_ID` - dokładnie: `weccqjwtlzelsmawkmnb`
- [ ] `OPENROUTER_API_KEY` - (opcjonalny) zaczyna się od `sk-or-v1-`

---

## 🧪 Testowanie

Po dodaniu sekretów, przetestuj czy działają:

1. Przejdź do **Actions** w swoim repo
2. Wybierz workflow **"Database Migrations"**
3. Kliknij **"Run workflow"**
4. Wybierz branch `master`
5. Kliknij **"Run workflow"** (zielony przycisk)

Jeśli wszystko jest OK:
- ✅ Workflow zakończy się sukcesem (zielony checkmark)
- ✅ Migracje zostaną zastosowane na produkcji

Jeśli są błędy:
- ❌ Sprawdź logi workflow (kliknij na nazwę jobu)
- ❌ Zweryfikuj czy wszystkie sekrety są poprawnie skopiowane
- ❌ Upewnij się że nie ma spacji na początku/końcu wartości

---

## 🔄 Aktualizacja Sekretów

Jeśli musisz zmienić sekret:

1. Przejdź do: Settings → Secrets and variables → Actions
2. Znajdź sekret na liście
3. Kliknij **Update**
4. Wklej nową wartość
5. Kliknij **Update secret**

---

## 🆘 Problemy?

### "Invalid access token"
- Wygeneruj nowy token w: https://supabase.com/dashboard/account/tokens
- Zaktualizuj `SUPABASE_ACCESS_TOKEN`

### "Authentication failed"
- Sprawdź czy `SUPABASE_ANON_KEY` jest poprawny
- Sprawdź czy `SUPABASE_SERVICE_ROLE_KEY` jest poprawny
- Upewnij się że skopiowałeś cały klucz (bez spacji)

### "Cannot connect to database"
- Sprawdź czy `SUPABASE_DB_PASSWORD` jest dokładnie: `3m!fvFhB!!f3GW6`
- Sprawdź czy `SUPABASE_PROJECT_ID` jest dokładnie: `weccqjwtlzelsmawkmnb`

---

## 📚 Więcej Informacji

- `.github/workflows/README.md` - dokumentacja workflows
- `QUICKSTART.md` - szybki start
- `SETUP-PRODUCTION.md` - szczegółowa instrukcja setupu
