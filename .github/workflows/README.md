# GitHub Actions Workflows

## 📋 Dostępne Workflows

### 1. CI (`ci.yml`)
Główny workflow CI/CD uruchamiany przy każdym pushu i pull requeście.

**Zadania:**
- ✅ Linting kodu
- ✅ Testy jednostkowe
- ✅ Testy API
- ✅ Testy E2E
- ✅ Build aplikacji

**Kiedy się uruchamia:**
- Push do branch `master`
- Pull request do branch `master`

---

### 2. Database Migrations (`db-migrations.yml`)
Workflow do zarządzania migracjami bazy danych na produkcji.

**Zadania:**
- 🔗 Linkuje projekt lokalny z Supabase
- 📊 Sprawdza status migracji
- 🚀 Uruchamia migracje na produkcyjnej bazie
- ✅ Weryfikuje poprawność migracji

**Kiedy się uruchamia:**
- **Ręcznie**: Przejdź do Actions → Database Migrations → Run workflow
- **Automatycznie**: Po push do `master` gdy zmienią się pliki w `supabase/migrations/`

**Wymagane GitHub Secrets:**
```
SUPABASE_ACCESS_TOKEN      # Token z https://supabase.com/dashboard/account/tokens
SUPABASE_DB_PASSWORD       # Hasło do bazy (3m!fvFhB!!f3GW6)
SUPABASE_PROJECT_ID        # ID projektu (weccqjwtlzelsmawkmnb)
```

---

## 🔐 Konfiguracja GitHub Secrets

Aby workflows działały poprawnie, musisz dodać następujące sekrety w swoim repozytorium:

**Przejdź do:** Settings → Secrets and variables → Actions → New repository secret

### Wymagane sekrety:

| Secret Name | Wartość | Opis |
|-------------|---------|------|
| `SUPABASE_URL` | `https://weccqjwtlzelsmawkmnb.supabase.co` | URL projektu Supabase |
| `SUPABASE_ANON_KEY` | `eyJ...` | Publiczny klucz API (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Klucz z pełnymi uprawnieniami |
| `SUPABASE_ACCESS_TOKEN` | `sbp_...` | Token CLI do zarządzania projektem |
| `SUPABASE_DB_PASSWORD` | `3m!fvFhB!!f3GW6` | Hasło do bazy PostgreSQL |
| `SUPABASE_PROJECT_ID` | `weccqjwtlzelsmawkmnb` | Reference ID projektu |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Klucz API do OpenRouter (opcjonalny dla testów) |

---

## 🚀 Jak używać

### Uruchomienie migracji ręcznie

1. Przejdź do zakładki **Actions** w swoim repozytorium GitHub
2. Wybierz workflow **"Database Migrations"**
3. Kliknij **"Run workflow"**
4. Wybierz branch (domyślnie: `master`)
5. Kliknij **"Run workflow"** (zielony przycisk)

GitHub uruchomi migracje i pokąże Ci logi w czasie rzeczywistym.

### Sprawdzanie wyników

Po zakończeniu workflow:
- ✅ **Zielony checkmark** = Migracje zastosowane pomyślnie
- ❌ **Czerwony X** = Błąd podczas migracji (kliknij żeby zobaczyć logi)

---

## 📝 Dodawanie nowych migracji

1. Stwórz nową migrację lokalnie:
   ```bash
   npx supabase migration new add_new_feature
   ```

2. Edytuj plik w `supabase/migrations/`

3. Commituj i pushuj:
   ```bash
   git add supabase/migrations/
   git commit -m "Add migration: add_new_feature"
   git push origin master
   ```

4. Workflow automatycznie uruchomi migrację na produkcji (jeśli włączyłeś auto-trigger)
   
   **LUB** uruchom ręcznie przez GitHub Actions UI

---

## 🔍 Monitorowanie

### Sprawdzanie logów workflow

1. Przejdź do **Actions**
2. Kliknij na konkretny workflow run
3. Kliknij na job **"Run Database Migrations"**
4. Rozwiń każdy step żeby zobaczyć szczegółowe logi

### Sprawdzanie statusu migracji w Supabase

Przejdź do SQL Editor w dashboardzie:
https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/editor

I uruchom:
```sql
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;
```

Zobaczysz listę wszystkich zastosowanych migracji.

---

## 🆘 Troubleshooting

### "Invalid access token"
- Wygeneruj nowy token: https://supabase.com/dashboard/account/tokens
- Zaktualizuj secret `SUPABASE_ACCESS_TOKEN` w GitHub

### "Cannot connect to database"
- Sprawdź czy `SUPABASE_DB_PASSWORD` jest poprawne
- Sprawdź Network Restrictions w Supabase Dashboard

### "Migration already applied"
- To normalne! Znaczy że migracja już działa na produkcji
- Workflow powinien zakończyć się sukcesem (status: ✅)

### Workflow się nie uruchamia
- Sprawdź czy wszystkie wymagane sekrety są dodane
- Sprawdź czy masz uprawnienia do uruchamiania Actions w repo
- Sprawdź zakładkę Actions czy workflows nie są wyłączone

---

## 📚 Przydatne linki

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
