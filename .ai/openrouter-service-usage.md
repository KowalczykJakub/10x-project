# OpenRouter Service - Dokumentacja Użycia

## Przegląd

OpenRouterService został w pełni zaimplementowany i jest gotowy do użycia w produkcji. Serwis zapewnia niezawodną komunikację z API OpenRouter.ai z pełną obsługą błędów, retry logic i walidacją odpowiedzi.

## Zaimplementowane Komponenty

### 1. Typy (`src/types.ts`)
Dodano kompleksowe typy TypeScript dla:
- `ChatMessage` - format wiadomości w API
- `ResponseFormat` - konfiguracja structured output
- `ChatCompletionRequest` i `ChatCompletionResponse` - request/response
- `OpenRouterServiceOptions` - opcje konfiguracji
- `OpenRouterError` - interfejs błędów

### 2. Schematy Zod (`src/lib/schemas/generation.schema.ts`)
- `FlashcardProposalSchema` - walidacja pojedynczej fiszki (front: 1-200 znaków, back: 1-500 znaków)
- `FlashcardProposalsSchema` - walidacja odpowiedzi LLM (obiekt z polem `proposals`, 1-10 fiszek)

### 3. Error Factory (`src/lib/errors/openrouter.errors.ts`)
Klasa `OpenRouterErrorFactory` do tworzenia standardowych błędów:
- `create()` - tworzenie błędów z kodem i szczegółami
- `isOpenRouterError()` - sprawdzanie typu błędu
- `isRetryable()` - określanie czy błąd kwalifikuje się do retry

### 4. Rate Limiter (`src/lib/utils/rate-limiter.ts`)
Klasa `RateLimiter` implementująca sliding window algorithm:
- 60 requestów na minutę (domyślnie)
- Automatyczne czekanie przy przekroczeniu limitu
- Getter `remainingRequests` do sprawdzania dostępności

### 5. OpenRouter Service (`src/lib/services/openrouter.service.ts`)
Główny serwis komunikacji z API:

#### Konstruktor
```typescript
const service = new OpenRouterService(apiKey, {
  baseUrl: 'https://openrouter.ai/api/v1',
  timeout: 30000,
  httpReferer: 'https://10xcards.app',
  appTitle: '10xCards Flashcard Generator',
  defaultModel: 'anthropic/claude-3.5-sonnet',
  retryAttempts: 2,
  retryDelay: 1000,
});
```

#### Metody publiczne
- `generateFlashcards(sourceText, model?)` - generowanie fiszek
- `chat<T>(request)` - uniwersalne zapytanie chat completion

#### Obsługa błędów
Wszystkie błędy są typu `OpenRouterError` z kodami:
- `VALIDATION_ERROR` - błędy walidacji wejścia
- `OPENROUTER_UNAUTHORIZED` (401) - nieprawidłowy API key
- `OPENROUTER_RATE_LIMIT` (429) - przekroczony limit
- `OPENROUTER_TIMEOUT` - przekroczony timeout
- `OPENROUTER_SERVER_ERROR` (500) - błąd serwera
- inne kody według dokumentacji API

### 6. Generation Service (`src/lib/services/generation.service.ts`)
Orkiestracja generowania fiszek:
- Integracja z OpenRouter API
- Zapis metadanych generacji do bazy (opcjonalnie)
- Logowanie błędów do tabeli `generation_error_logs`
- Obliczanie czasu generacji
- Haszowanie tekstu źródłowego (SHA-256)

### 7. API Endpoint (`src/pages/api/generations/index.ts`)
Endpoint HTTP z pełną obsługą:
- Walidacja żądań przez Zod schema
- Mapowanie błędów OpenRouter na kody HTTP
- Wsparcie dla CORS (development)
- Opcjonalna integracja z Supabase

## Przykłady Użycia

### Podstawowe użycie

```typescript
import { OpenRouterService } from '@/lib/services/openrouter.service';

// Inicjalizacja
const apiKey = import.meta.env.OPENROUTER_API_KEY;
const service = new OpenRouterService(apiKey);

// Generowanie fiszek
try {
  const proposals = await service.generateFlashcards(
    "Mitochondrium jest organellą komórkową odpowiedzialną za produkcję ATP...",
    "anthropic/claude-3.5-sonnet"
  );
  
  console.log(`Wygenerowano ${proposals.length} fiszek`);
  proposals.forEach(p => {
    console.log(`Q: ${p.front}`);
    console.log(`A: ${p.back}`);
  });
} catch (error) {
  if (OpenRouterErrorFactory.isOpenRouterError(error)) {
    console.error(`OpenRouter error [${error.code}]:`, error.message);
    if (error.retryable) {
      console.log('Błąd jest retryable - można spróbować ponownie później');
    }
  }
}
```

### Użycie przez GenerationService

```typescript
import { GenerationService } from '@/lib/services/generation.service';

const apiKey = import.meta.env.OPENROUTER_API_KEY;
const service = new GenerationService(apiKey, supabaseClient);

const result = await service.generateFlashcards(
  sourceText,
  userId, // opcjonalny, dla zapisu do bazy
  'anthropic/claude-3.5-sonnet'
);

console.log('Generation:', result.generation);
console.log('Proposals:', result.proposals);
```

### Uniwersalne chat completion

```typescript
const response = await service.chat({
  model: 'anthropic/claude-3.5-sonnet',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing.' }
  ],
  temperature: 0.7,
  maxTokens: 1000,
});

console.log(response.choices[0].message.content);
console.log('Tokens used:', response.usage.total_tokens);
```

### Obsługa błędów w API endpoint

```typescript
try {
  const result = await generationService.generateFlashcards(
    sourceText,
    userId,
    model
  );
  return new Response(JSON.stringify(result), { status: 201 });
} catch (error) {
  if (OpenRouterErrorFactory.isOpenRouterError(error)) {
    const statusMap = {
      'VALIDATION_ERROR': 400,
      'OPENROUTER_UNAUTHORIZED': 401,
      'OPENROUTER_RATE_LIMIT': 429,
      'OPENROUTER_TIMEOUT': 504,
    };
    const status = statusMap[error.code] || 500;
    
    return new Response(
      JSON.stringify({
        error: 'Generation Failed',
        code: error.code,
        message: error.message,
      }),
      { status }
    );
  }
  throw error;
}
```

## Konfiguracja

### Zmienne środowiskowe

W pliku `.env`:
```env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

### Typy w env.d.ts

```typescript
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}
```

## Bezpieczeństwo

✅ **Zaimplementowane zabezpieczenia:**
- HTTPS only (wymuszane w konstruktorze)
- API key validation (nie pusty string)
- Input sanitization (usuwanie znaków kontrolnych)
- Rate limiting (60 req/min)
- Timeout management (30s domyślnie)
- Secure error messages (bez ujawniania wrażliwych danych)

❌ **NIE:**
- Hardcodować API key w kodzie
- Używać serwisu w komponentach klienckich
- Logować pełnych kluczy API
- Przekazywać API key przez URL

## Testowanie

### Test w API endpoint

Użyj `api-test.http`:
```http
POST http://localhost:4321/api/generations
Content-Type: application/json

{
  "source_text": "Fotosynteza jest procesem biologicznym, w którym rośliny przekształcają energię świetlną w energię chemiczną. Proces ten zachodzi w chloroplastach i wymaga obecności chlorofilu, dwutlenku węgla i wody. [powtórz jeszcze 950 znaków aby osiągnąć minimum 1000 znaków]"
}
```

### Oczekiwana odpowiedź (201 Created):
```json
{
  "generation": {
    "id": 1,
    "model": "anthropic/claude-3.5-sonnet",
    "generated_count": 5,
    "accepted_unedited_count": 0,
    "accepted_edited_count": 0,
    "source_text_length": 1234,
    "generation_duration": 2543,
    "created_at": "2026-01-31T12:00:00Z"
  },
  "proposals": [
    {
      "front": "Czym jest fotosynteza?",
      "back": "Proces biologiczny, w którym rośliny przekształcają energię świetlną w energię chemiczną"
    }
  ]
}
```

## Struktura Plików

```
src/
├── lib/
│   ├── errors/
│   │   └── openrouter.errors.ts      # Error factory
│   ├── schemas/
│   │   └── generation.schema.ts      # Zod schemas
│   ├── services/
│   │   ├── openrouter.service.ts     # OpenRouter API client
│   │   └── generation.service.ts     # Generation orchestration
│   ├── utils/
│   │   ├── crypto.ts                 # SHA-256 hashing
│   │   └── rate-limiter.ts           # Rate limiting
│   └── types.ts                       # TypeScript types
├── pages/
│   └── api/
│       └── generations/
│           └── index.ts              # HTTP endpoint
└── env.d.ts                          # Environment types
```

## Status Implementacji

✅ **Ukończone:**
- Typy i interfejsy
- Schematy Zod
- Error Factory
- Rate Limiter
- OpenRouter Service (pełna implementacja)
- Generation Service (integracja z bazą)
- API Endpoint (obsługa błędów)
- Dokumentacja

🔄 **Do zrobienia w przyszłości:**
- Testy jednostkowe (opcjonalne)
- Testy integracyjne (opcjonalne)
- Middleware autentykacji (dla userId)
- Monitoring i metryki
- Cache dla identycznych tekstów źródłowych

## Wsparcie i Troubleshooting

### Problem: "OPENROUTER_API_KEY environment variable is not set"
**Rozwiązanie:** Dodaj klucz API do pliku `.env`

### Problem: "OPENROUTER_TIMEOUT: Request exceeded 30000ms timeout"
**Rozwiązanie:** Zwiększ timeout w opcjach lub sprawdź połączenie internetowe

### Problem: "OPENROUTER_RATE_LIMIT"
**Rozwiązanie:** Poczekaj ~1 minutę lub zwiększ rate limit w RateLimiter

### Problem: "OPENROUTER_VALIDATION_ERROR"
**Rozwiązanie:** Sprawdź czy źródłowy tekst ma 1000-10000 znaków

### Problem: "OPENROUTER_UNAUTHORIZED"
**Rozwiązanie:** Sprawdź czy API key jest poprawny

---

**Implementacja zakończona pomyślnie! 🎉**
