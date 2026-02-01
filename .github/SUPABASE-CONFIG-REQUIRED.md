# ⚠️ WYMAGANA KONFIGURACJA SUPABASE

## 🚨 KRYTYCZNE: Wyłącz Email Confirmation

Testy nie przejdą dopóki tego nie zrobisz!

### Dlaczego?
Testy tworzą użytkowników przez API, ale CI **nie ma dostępu do skrzynki email**. Jeśli email confirmation jest włączone, użytkownicy nie mogą się zalogować, co powoduje błąd:

```
Failed to login test user (401)
```

---

## 📋 Instrukcja krok po kroku

### Krok 1: Otwórz Supabase Dashboard

Przejdź do ustawień autentykacji swojego projektu:

🔗 **https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/auth/providers**

(Lub: Dashboard → Authentication → Providers)

---

### Krok 2: Kliknij na "Email"

W liście providerów znajdź **Email** i kliknij żeby otworzyć ustawienia.

---

### Krok 3: Wyłącz "Confirm email"

Znajdź checkbox:
```
☑ Confirm email
```

**Odznacz go** (ustaw na OFF):
```
☐ Confirm email
```

---

### Krok 4: Zapisz zmiany

Kliknij **"Save"** na dole strony.

---

### Krok 5: Zweryfikuj (opcjonalnie)

Możesz też sprawdzić ustawienia ogólne:

🔗 **https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/auth/url-configuration**

Upewnij się że:
- **Enable email confirmations** jest **OFF**
- **Enable email change confirmations** może być ON lub OFF (nie wpływa na testy)

---

## ✅ Jak sprawdzić czy działa?

### Test lokalny:

Utwórz testowego użytkownika i spróbuj się zalogować:

```bash
# Uruchom aplikację
npm run dev

# W innym terminalu (lub Postman):
# 1. Zarejestruj użytkownika
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@",
    "confirmPassword": "Test123!@"
  }'

# 2. OD RAZU spróbuj się zalogować (bez klikania w email!)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@"
  }'
```

**Oczekiwany rezultat**:
- ✅ Login **zwraca status 200** - Confirmation wyłączone ✓
- ❌ Login **zwraca status 401** - Confirmation NADAL włączone!

---

## 🔍 Dodatkowe opcje (opcjonalne)

Możesz też rozważyć:

### 1. Wyłącz rate limiting dla testów (tylko w dev)

⚠️ **NIE ZALECANE W PRODUKCJI** - ale jeśli to środowisko tylko do testów:

Dashboard → Authentication → Settings → Rate Limits

Ustaw wyższe limity:
```
Sign ups and sign ins: 100 (zamiast 30)
```

### 2. Użyj lokalnego Supabase dla testów

Zamiast produkcyjnej bazy, uruchom lokalny Supabase:

```bash
npx supabase start
```

I w `.env` użyj:
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbG... # local anon key
```

---

## 🆘 Nadal nie działa?

### Sprawdź logi global setup:

Po następnym pushu, zobacz logi w GitHub Actions:

```
🔧 Setting up test environment...
📝 Creating shared test user for CI...
🔐 Testing login with shared user...
```

Jeśli zobaczysz:
```
❌ CRITICAL: Shared test user CANNOT login!
```

Oznacza to że email confirmation NADAL jest włączone.

### Sprawdź czy użytkownik istnieje:

Przejdź do:
🔗 **https://supabase.com/dashboard/project/weccqjwtlzelsmawkmnb/auth/users**

Poszukaj: `ci-test-user@example.com`

**Jeśli ma status** "Waiting for verification":
→ Email confirmation jest włączone! Wyłącz i usuń tego usera, zostanie utworzony na nowo.

**Jeśli ma status** "Confirmed":
→ OK! Powinno działać.

---

## 📚 Dokumentacja Supabase

- Email Auth: https://supabase.com/docs/guides/auth/auth-email
- Email confirmation: https://supabase.com/docs/guides/auth/auth-email#confirm-email
- Rate limits: https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits

---

## ✅ Checklist

Po wykonaniu powyższych kroków:

- [ ] Email confirmation wyłączone w Supabase
- [ ] Zweryfikowane przez test lokalny (curl)
- [ ] Pushowane zmiany do GitHub
- [ ] Pipeline przechodzi testy API ✓

---

**⚠️ BEZ WYŁĄCZENIA EMAIL CONFIRMATION TESTY NIE PRZEJDĄ!**
