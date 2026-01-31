# Status Implementacji API: POST /api/generations

## ✅ Zaimplementowane Komponenty

### 1. Schemat Walidacji
**Plik:** `src/lib/schemas/generation.schema.ts`
- ✅ `CreateGenerationSchema` - walidacja source_text (1000-10000 znaków)
- ✅ `FlashcardProposalSchema` - walidacja struktury fiszek
- ✅ `FlashcardProposalsSchema` - walidacja tablicy propozycji (1-20 fiszek)

### 2. Utility Crypto
**Plik:** `src/lib/utils/crypto.ts`
- ✅ `sha256Hash()` - hashowanie SHA-256 dla anonimizacji źródłowego tekstu

### 3. OpenRouter Service (MOCK)
**Plik:** `src/lib/services/openrouter.service.ts`
- ✅ `generateFlashcards()` - zwraca zamockowane fiszki
- ✅ `getMockedFlashcards()` - generuje realistyczne dane testowe
- ⚠️ Symuluje opóźnienie API (1.5s) dla realizmu
- 🔜 TODO: Implementacja prawdziwej integracji z OpenRouter API

### 4. Generation Service
**Plik:** `src/lib/services/generation.service.ts`
- ✅ `generateFlashcards()` - orkiestracja procesu generowania
- ✅ Mierzenie czasu trwania generowania
- ✅ Hashowanie źródłowego tekstu
- ✅ Zwraca GenerationDTO + proposals
- 🔜 TODO: Integracja z bazą danych

### 5. API Route Handler
**Plik:** `src/pages/api/generations/index.ts`
- ✅ POST endpoint `/api/generations`
- ✅ Parsowanie i walidacja request body
- ✅ Obsługa błędów (400, 500)
- ✅ CORS dla deweloperki
- ⚠️ BRAK autentykacji (na razie)
- 🔜 TODO: Dodać middleware autentykacji

### 6. Pliki Testowe
- ✅ `test-generation-api.http` - testy REST Client dla VS Code
- ✅ `test-api.sh` - skrypt bash do testowania API

---

## 🎯 Obecna Funkcjonalność

### Endpoint: `POST /api/generations`

**Request:**
```json
{
  "source_text": "Tekst minimum 1000 znaków..."
}
```

**Response (201 Created):**
```json
{
  "generation": {
    "id": 1234,
    "model": "anthropic/claude-3.5-sonnet",
    "generated_count": 6,
    "accepted_unedited_count": 0,
    "accepted_edited_count": 0,
    "source_text_length": 1523,
    "generation_duration": 1542,
    "created_at": "2026-01-31T12:34:56.789Z"
  },
  "proposals": [
    {
      "front": "What is the main topic of this text?",
      "back": "The text discusses TypeScript..."
    },
    {
      "front": "What is the key concept introduced?",
      "back": "The key concept relates to..."
    }
    // ... więcej fiszek
  ]
}
```

**Błędy:**
- `400 Bad Request` - nieprawidłowa walidacja (za krótki/długi tekst)
- `500 Internal Server Error` - błąd podczas generowania

---

## 🚧 Co Jest Na Razie Zamockowane

1. **OpenRouter API** - zwraca hardcoded fiszki zamiast wywoływać prawdziwe API
2. **Baza danych** - nie zapisuje do Supabase, generuje losowe ID
3. **Autentykacja** - brak weryfikacji JWT
4. **Rate limiting** - brak ograniczeń

---

## 📋 Następne Kroki (Gdy Będzie Gotowe)

### Priorytet 1: Integracja z OpenRouter API
- [ ] Odkomentować prawdziwe wywołanie API w `openrouter.service.ts`
- [ ] Dodać obsługę błędów API (timeout, rate limit, itp.)
- [ ] Skonfigurować `OPENROUTER_API_KEY` w `.env`

### Priorytet 2: Integracja z Bazą Danych
- [ ] Zapisywanie generations do tabeli `generations`
- [ ] Logowanie błędów do `generation_error_logs`
- [ ] Wykorzystanie RLS policies

### Priorytet 3: Autentykacja
- [ ] Middleware do weryfikacji JWT
- [ ] Ekstrakcja `user_id` z tokena
- [ ] Obsługa błędów 401 Unauthorized

### Priorytet 4: Rate Limiting
- [ ] Implementacja rate limitera (Redis lub in-memory)
- [ ] Zwracanie 429 Too Many Requests
- [ ] Nagłówki `Retry-After`

---

## 🧪 Jak Testować

### Opcja 1: REST Client (VS Code)
1. Zainstaluj rozszerzenie "REST Client" w VS Code
2. Otwórz `test-generation-api.http`
3. Kliknij "Send Request" nad każdym testem

### Opcja 2: Bash Script
```bash
chmod +x test-api.sh
./test-api.sh
```

### Opcja 3: Curl Ręcznie
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "..."}'  # min 1000 znaków
```

### Opcja 4: Postman / Insomnia
Importuj request:
- Method: POST
- URL: `http://localhost:4321/api/generations`
- Header: `Content-Type: application/json`
- Body: JSON z polem `source_text`

---

## 📝 Notatki Deweloperskie

- Endpoint zwraca dane w ~1.5-2 sekundy (symulacja czasu API)
- Liczba wygenerowanych fiszek zależy od długości tekstu (3-10 fiszek)
- ID generacji jest losowe (mock), w produkcji będzie z bazy
- Wszystkie timestampy są w formacie ISO 8601
- CORS jest włączony dla deweloperki (Access-Control-Allow-Origin: *)
