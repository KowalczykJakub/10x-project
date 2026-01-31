# OpenRouter Service - Plan Wdrożenia

## 1. Opis Usługi

### 1.1 Cel i Zakres

`OpenRouterService` jest serwisem odpowiedzialnym za komunikację z API OpenRouter.ai w celu generowania odpowiedzi z modeli LLM. Usługa ta:

- **Abstrakcyjność**: Udostępnia spójny interfejs do komunikacji z różnymi modelami LLM dostępnymi przez OpenRouter
- **Bezpieczeństwo**: Zarządza kluczem API i obsługuje uwierzytelnianie
- **Niezawodność**: Implementuje timeout, retry logic i szczegółową obsługę błędów
- **Walidacja**: Zapewnia, że odpowiedzi z API są zgodne ze zdefiniowanym schematem
- **Parametryzacja**: Pozwala na elastyczne konfigurowanie komunikatów systemowych, użytkownika, schematów odpowiedzi oraz parametrów modelu

### 1.2 Odpowiedzialności

1. **Komunikacja z API**: Wykonywanie zapytań HTTP POST do OpenRouter API
2. **Zarządzanie Kluczem API**: Bezpieczne przechowywanie i używanie klucza API
3. **Konstrukcja Zapytań**: Budowanie właściwie sformatowanych zapytań z komunikatami systemowymi, użytkownika i parametrami
4. **Strukturyzacja Odpowiedzi**: Wymuszanie JSON Schema w odpowiedziach modelu poprzez `response_format`
5. **Walidacja Odpowiedzi**: Parsowanie i walidacja odpowiedzi zgodnie ze schematem Zod
6. **Obsługa Błędów**: Odpowiednie przechwytywanie i raportowanie błędów API
7. **Timeout Management**: Zapobieganie nieskończonym oczekiwaniom na odpowiedź

## 2. Opis Konstruktora

### 2.1 Sygnatura

```typescript
constructor(apiKey: string, options?: OpenRouterServiceOptions)
```

### 2.2 Parametry

#### `apiKey: string` (wymagany)
- Klucz API do uwierzytelniania w OpenRouter
- Powinien być przechowywany jako zmienna środowiskowa (`OPENROUTER_API_KEY`)
- Walidowany w konstruktorze - rzuca błąd jeśli pusty lub undefined

#### `options?: OpenRouterServiceOptions` (opcjonalny)
```typescript
interface OpenRouterServiceOptions {
  baseUrl?: string;           // Domyślnie: 'https://openrouter.ai/api/v1'
  timeout?: number;            // Domyślnie: 30000 (30 sekund)
  httpReferer?: string;        // Domyślnie: 'https://10xcards.app'
  appTitle?: string;           // Domyślnie: '10xCards Flashcard Generator'
  defaultModel?: string;       // Domyślnie: 'anthropic/claude-3.5-sonnet'
  retryAttempts?: number;      // Domyślnie: 2
  retryDelay?: number;         // Domyślnie: 1000 (1 sekunda)
}
```

### 2.3 Walidacja Konstruktora

Konstruktor musi walidować:
1. Obecność klucza API (nie pusty string)
2. Format klucza API (opcjonalnie - sprawdzenie prefixu jeśli OpenRouter ma określony format)
3. Wartości opcji (np. timeout > 0, retryAttempts >= 0)

Przykład implementacji:
```typescript
constructor(apiKey: string, options: OpenRouterServiceOptions = {}) {
  // Walidacja klucza API
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OpenRouter API key is required and cannot be empty');
  }
  
  // Przypisanie i walidacja opcji
  this.apiKey = apiKey;
  this.baseUrl = options.baseUrl || 'https://openrouter.ai/api/v1';
  
  const timeout = options.timeout ?? 30000;
  if (timeout <= 0) {
    throw new Error('Timeout must be greater than 0');
  }
  this.timeout = timeout;
  
  const retryAttempts = options.retryAttempts ?? 2;
  if (retryAttempts < 0) {
    throw new Error('Retry attempts cannot be negative');
  }
  this.retryAttempts = retryAttempts;
  
  this.retryDelay = options.retryDelay ?? 1000;
  this.httpReferer = options.httpReferer || 'https://10xcards.app';
  this.appTitle = options.appTitle || '10xCards Flashcard Generator';
  this.defaultModel = options.defaultModel || 'anthropic/claude-3.5-sonnet';
}
```

## 3. Publiczne Metody i Pola

### 3.1 Główna Metoda: `generateFlashcards`

#### Sygnatura
```typescript
async generateFlashcards(
  sourceText: string,
  model?: string
): Promise<FlashcardProposalDTO[]>
```

#### Parametry
- `sourceText`: Tekst źródłowy do generowania fiszek
- `model`: (opcjonalny) Nazwa modelu - jeśli nie podana, używa `defaultModel`

#### Zwracana Wartość
- Promise z tablicą `FlashcardProposalDTO[]`

#### Proces Wykonania
1. Walidacja parametrów wejściowych
2. Budowanie komunikatu systemowego (system message)
3. Budowanie komunikatu użytkownika (user message)
4. Przygotowanie schematu JSON dla `response_format`
5. Wywołanie API przez `callAPI`
6. Parsowanie i walidacja odpowiedzi
7. Zwrócenie zwalidowanych propozycji

#### Przykład Użycia
```typescript
const service = new OpenRouterService(apiKey);
const proposals = await service.generateFlashcards(
  "Mitochondrium jest organellą komórkową odpowiedzialną za produkcję ATP...",
  "anthropic/claude-3.5-sonnet"
);
```

### 3.2 Uniwersalna Metoda: `chat`

Dla większej elastyczności, warto dodać uniwersalną metodę `chat`, która pozwala na dowolne użycie API:

#### Sygnatura
```typescript
async chat<T = unknown>(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse<T>>
```

#### Parametry
```typescript
interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}
```

#### Zwracana Wartość
```typescript
interface ChatCompletionResponse<T = unknown> {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  parsed?: T; // Sparsowana odpowiedź jeśli responseFormat był użyty
}
```

#### Przykład Użycia
```typescript
const response = await service.chat({
  model: 'anthropic/claude-3.5-sonnet',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing in simple terms.' }
  ],
  temperature: 0.7,
  maxTokens: 500
});
```

## 4. Prywatne Metody i Pola

### 4.1 Pola Prywatne

```typescript
private readonly apiKey: string;
private readonly baseUrl: string;
private readonly timeout: number;
private readonly httpReferer: string;
private readonly appTitle: string;
private readonly defaultModel: string;
private readonly retryAttempts: number;
private readonly retryDelay: number;
```

### 4.2 Metoda: `buildSystemMessage`

#### Cel
Konstruuje szczegółowy komunikat systemowy dla generowania fiszek.

#### Sygnatura
```typescript
private buildSystemMessage(): string
```

#### Implementacja
```typescript
private buildSystemMessage(): string {
  return `You are an expert educational content creator specializing in creating effective flashcards for learning.

Your task is to analyze the provided text and generate high-quality flashcard proposals following these rules:

1. **Question Quality**:
   - Create clear, specific questions that test understanding
   - Avoid yes/no questions when possible
   - Focus on key concepts, definitions, and relationships
   - Length: 1-200 characters

2. **Answer Quality**:
   - Provide concise but complete answers
   - Include essential context when needed
   - Use clear, simple language
   - Length: 1-500 characters

3. **Quantity**:
   - Generate 3-10 flashcards depending on content richness
   - Prioritize quality over quantity
   - Avoid redundant or overlapping questions

4. **Content Coverage**:
   - Cover the most important concepts
   - Include definitions, processes, and relationships
   - Maintain factual accuracy

Return your response as a valid JSON object matching the provided schema.`;
}
```

### 4.3 Metoda: `buildUserMessage`

#### Cel
Konstruuje komunikat użytkownika z tekstem źródłowym.

#### Sygnatura
```typescript
private buildUserMessage(sourceText: string): string
```

#### Implementacja
```typescript
private buildUserMessage(sourceText: string): string {
  return `Generate flashcards from the following text:\n\n${sourceText}`;
}
```

### 4.4 Metoda: `buildResponseFormat`

#### Cel
Konstruuje obiekt `response_format` zgodny z wymaganiami OpenRouter API.

#### Sygnatura
```typescript
private buildResponseFormat(): ResponseFormat
```

#### Implementacja
```typescript
private buildResponseFormat(): ResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'flashcard_proposals',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          proposals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                front: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 200,
                  description: 'The question or prompt on the front of the flashcard'
                },
                back: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 500,
                  description: 'The answer or explanation on the back of the flashcard'
                }
              },
              required: ['front', 'back'],
              additionalProperties: false
            },
            minItems: 1,
            maxItems: 10
          }
        },
        required: ['proposals'],
        additionalProperties: false
      }
    }
  };
}
```

**Uwaga**: Format ten wymusza, aby model zwrócił odpowiedź zgodną ze schematem. Parametr `strict: true` aktywuje strict mode, który gwarantuje 100% zgodność ze schematem.

### 4.5 Metoda: `callAPI`

#### Cel
Wykonuje niskopoziomowe wywołanie API z obsługą retry i timeout.

#### Sygnatura
```typescript
private async callAPI(
  model: string,
  messages: ChatMessage[],
  options: APICallOptions = {}
): Promise<unknown>
```

#### Parametry
```typescript
interface APICallOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}
```

#### Proces Wykonania
1. Przygotowanie kontrolera abort dla timeout
2. Budowanie body zapytania
3. Wykonanie fetch z odpowiednimi nagłówkami
4. Obsługa timeout (AbortController)
5. Sprawdzenie statusu odpowiedzi
6. Parsowanie JSON
7. Retry logic w przypadku błędów przejściowych (rate limit, 5xx)

#### Implementacja
```typescript
private async callAPI(
  model: string,
  messages: ChatMessage[],
  options: APICallOptions = {}
): Promise<unknown> {
  let lastError: Error | null = null;
  
  // Retry logic
  for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const requestBody = {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        ...(options.responseFormat && { response_format: options.responseFormat }),
        ...(options.topP !== undefined && { top_p: options.topP }),
        ...(options.frequencyPenalty !== undefined && { frequency_penalty: options.frequencyPenalty }),
        ...(options.presencePenalty !== undefined && { presence_penalty: options.presencePenalty }),
      };
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.httpReferer,
          'X-Title': this.appTitle,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Sprawdzenie statusu
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        // Retry dla błędów przejściowych
        if (this.shouldRetry(response.status, attempt)) {
          lastError = new Error(`API Error ${response.status}: ${errorMessage}`);
          await this.delay(this.retryDelay * (attempt + 1)); // Exponential backoff
          continue;
        }
        
        // Rzuć błąd dla błędów nieprzejściowych
        throw this.createAPIError(response.status, errorMessage);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `OPENROUTER_TIMEOUT: Request exceeded ${this.timeout}ms timeout`
        );
      }
      
      // Retry dla błędów sieciowych
      if (this.isNetworkError(error) && attempt < this.retryAttempts) {
        lastError = error instanceof Error ? error : new Error('Network error');
        await this.delay(this.retryDelay * (attempt + 1));
        continue;
      }
      
      throw error;
    }
  }
  
  // Jeśli wszystkie próby się nie powiodły
  throw lastError || new Error('All retry attempts failed');
}
```

### 4.6 Metoda: `shouldRetry`

#### Cel
Określa, czy błąd API kwalifikuje się do ponowienia próby.

#### Sygnatura
```typescript
private shouldRetry(statusCode: number, currentAttempt: number): boolean
```

#### Implementacja
```typescript
private shouldRetry(statusCode: number, currentAttempt: number): boolean {
  if (currentAttempt >= this.retryAttempts) {
    return false;
  }
  
  // Retry dla rate limit i błędów serwera
  const retryableStatuses = [429, 500, 502, 503, 504];
  return retryableStatuses.includes(statusCode);
}
```

### 4.7 Metoda: `isNetworkError`

#### Cel
Sprawdza, czy błąd jest błędem sieciowym kwalifikującym się do retry.

#### Sygnatura
```typescript
private isNetworkError(error: unknown): boolean
```

#### Implementacja
```typescript
private isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  
  const networkErrorTypes = [
    'NetworkError',
    'FetchError',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT'
  ];
  
  return networkErrorTypes.some(type => 
    error.name.includes(type) || error.message.includes(type)
  );
}
```

### 4.8 Metoda: `createAPIError`

#### Cel
Tworzy specjalistyczne błędy na podstawie kodu statusu API.

#### Sygnatura
```typescript
private createAPIError(statusCode: number, message: string): Error
```

#### Implementacja
```typescript
private createAPIError(statusCode: number, message: string): Error {
  const errorMap: Record<number, string> = {
    400: 'OPENROUTER_BAD_REQUEST',
    401: 'OPENROUTER_UNAUTHORIZED',
    403: 'OPENROUTER_FORBIDDEN',
    404: 'OPENROUTER_NOT_FOUND',
    429: 'OPENROUTER_RATE_LIMIT',
    500: 'OPENROUTER_SERVER_ERROR',
    502: 'OPENROUTER_BAD_GATEWAY',
    503: 'OPENROUTER_SERVICE_UNAVAILABLE',
    504: 'OPENROUTER_GATEWAY_TIMEOUT',
  };
  
  const errorCode = errorMap[statusCode] || 'OPENROUTER_UNKNOWN_ERROR';
  const error = new Error(`${errorCode}: ${message}`);
  (error as any).statusCode = statusCode;
  (error as any).code = errorCode;
  
  return error;
}
```

### 4.9 Metoda: `delay`

#### Cel
Helper do opóźnienia wykonania (dla retry logic).

#### Sygnatura
```typescript
private delay(ms: number): Promise<void>
```

#### Implementacja
```typescript
private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 4.10 Metoda: `parseResponse`

#### Cel
Parsuje i waliduje odpowiedź API zgodnie ze schematem Zod.

#### Sygnatura
```typescript
private parseResponse(response: unknown): FlashcardProposalDTO[]
```

#### Implementacja
```typescript
private parseResponse(response: unknown): FlashcardProposalDTO[] {
  // Walidacja podstawowej struktury odpowiedzi
  if (!response || typeof response !== 'object') {
    throw new Error('OPENROUTER_INVALID_RESPONSE: Response is not an object');
  }
  
  const apiResponse = response as any;
  
  // Sprawdzenie czy choices istnieje
  if (!apiResponse.choices || !Array.isArray(apiResponse.choices) || apiResponse.choices.length === 0) {
    throw new Error('OPENROUTER_INVALID_RESPONSE: No choices in response');
  }
  
  const firstChoice = apiResponse.choices[0];
  
  // Sprawdzenie czy message istnieje
  if (!firstChoice.message || !firstChoice.message.content) {
    throw new Error('OPENROUTER_INVALID_RESPONSE: No message content in response');
  }
  
  const content = firstChoice.message.content;
  
  // Parsowanie JSON z contentu
  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `OPENROUTER_INVALID_JSON: Failed to parse response content as JSON: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
  
  // Walidacja ze schematem Zod
  const validationResult = FlashcardProposalsSchema.safeParse(parsedContent);
  
  if (!validationResult.success) {
    const errors = validationResult.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    throw new Error(`OPENROUTER_VALIDATION_ERROR: ${errors}`);
  }
  
  return validationResult.data.proposals;
}
```

## 5. Obsługa Błędów

### 5.1 Kategorie Błędów

Serwis musi obsługiwać następujące kategorie błędów:

#### 1. Błędy Walidacji Wejściowej
- **Kod**: `VALIDATION_ERROR`
- **Przykłady**: Pusty sourceText, nieprawidłowy model
- **Obsługa**: Walidacja w metodach publicznych, rzucanie błędów z jasnymi komunikatami

#### 2. Błędy Autentykacji
- **Kody**: `OPENROUTER_UNAUTHORIZED` (401), `OPENROUTER_FORBIDDEN` (403)
- **Przyczyny**: Nieprawidłowy klucz API, brak uprawnień
- **Obsługa**: Nie retry, natychmiastowe rzucenie błędu

#### 3. Błędy Rate Limit
- **Kod**: `OPENROUTER_RATE_LIMIT` (429)
- **Przyczyny**: Przekroczono limit zapytań
- **Obsługa**: Retry z exponential backoff

#### 4. Błędy Timeout
- **Kod**: `OPENROUTER_TIMEOUT`
- **Przyczyny**: Przekroczono timeout (30s)
- **Obsługa**: Nie retry, rzucenie błędu

#### 5. Błędy Serwera
- **Kody**: `OPENROUTER_SERVER_ERROR` (500), `OPENROUTER_BAD_GATEWAY` (502), `OPENROUTER_SERVICE_UNAVAILABLE` (503), `OPENROUTER_GATEWAY_TIMEOUT` (504)
- **Przyczyny**: Problemy po stronie OpenRouter
- **Obsługa**: Retry z exponential backoff

#### 6. Błędy Sieci
- **Przykłady**: ECONNRESET, ETIMEDOUT, ENOTFOUND
- **Przyczyny**: Problemy z połączeniem internetowym
- **Obsługa**: Retry z exponential backoff

#### 7. Błędy Parsowania Odpowiedzi
- **Kody**: `OPENROUTER_INVALID_RESPONSE`, `OPENROUTER_INVALID_JSON`, `OPENROUTER_VALIDATION_ERROR`
- **Przyczyny**: Nieprawidłowy format odpowiedzi, niezgodność ze schematem
- **Obsługa**: Nie retry, rzucenie błędu z szczegółami

### 5.2 Struktura Błędów

Wszystkie błędy powinny implementować następującą strukturę:

```typescript
interface OpenRouterError extends Error {
  code: string;           // np. 'OPENROUTER_RATE_LIMIT'
  statusCode?: number;    // Kod HTTP jeśli dotyczy
  details?: unknown;      // Dodatkowe szczegóły błędu
  retryable: boolean;     // Czy błąd kwalifikuje się do retry
}
```

### 5.3 Factory Błędów

Implementacja factory dla spójnego tworzenia błędów:

```typescript
class OpenRouterErrorFactory {
  static create(
    code: string,
    message: string,
    options: {
      statusCode?: number;
      details?: unknown;
      retryable?: boolean;
    } = {}
  ): OpenRouterError {
    const error = new Error(message) as OpenRouterError;
    error.code = code;
    error.statusCode = options.statusCode;
    error.details = options.details;
    error.retryable = options.retryable ?? false;
    error.name = 'OpenRouterError';
    return error;
  }
}
```

### 5.4 Przykłady Obsługi Błędów

#### W Metodzie Publicznej
```typescript
async generateFlashcards(
  sourceText: string,
  model?: string
): Promise<FlashcardProposalDTO[]> {
  // Walidacja wejściowa
  if (!sourceText || sourceText.trim() === '') {
    throw OpenRouterErrorFactory.create(
      'VALIDATION_ERROR',
      'Source text cannot be empty'
    );
  }
  
  if (sourceText.length > 10000) {
    throw OpenRouterErrorFactory.create(
      'VALIDATION_ERROR',
      'Source text exceeds maximum length of 10000 characters'
    );
  }
  
  try {
    const systemMessage = this.buildSystemMessage();
    const userMessage = this.buildUserMessage(sourceText);
    const responseFormat = this.buildResponseFormat();
    
    const response = await this.callAPI(
      model || this.defaultModel,
      [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      { responseFormat }
    );
    
    return this.parseResponse(response);
  } catch (error) {
    // Propaguj błędy OpenRouter bez zmian
    if (error instanceof Error && error.name === 'OpenRouterError') {
      throw error;
    }
    
    // Opakuj nieznane błędy
    throw OpenRouterErrorFactory.create(
      'OPENROUTER_UNKNOWN_ERROR',
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
      { details: error }
    );
  }
}
```

## 6. Kwestie Bezpieczeństwa

### 6.1 Ochrona Klucza API

#### 1. Nigdy nie zapisuj klucza w kodzie
```typescript
// ❌ ZŁE
const service = new OpenRouterService('sk-or-v1-abc123...');

// ✅ DOBRE
const apiKey = import.meta.env.OPENROUTER_API_KEY;
if (!apiKey) {
  throw new Error('OPENROUTER_API_KEY environment variable is required');
}
const service = new OpenRouterService(apiKey);
```

#### 2. Konfiguracja zmiennych środowiskowych
**Plik `.env`** (nie commituj do repozytorium):
```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

**Plik `src/env.d.ts`**:
```typescript
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

#### 3. Backend-Only Usage
OpenRouterService powinien być używany **TYLKO po stronie serwera**:
- W Astro endpoint'ach (`.astro` pliki w trybie SSR)
- W API routes (`src/pages/api/*`)
- NIGDY w komponentach klienckich React

### 6.2 Rate Limiting

Implementuj rate limiting po stronie aplikacji, aby zapobiec nadmiernemu zużyciu API:

```typescript
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }
    
    this.requests.push(now);
  }
}

// Użycie w OpenRouterService
private rateLimiter = new RateLimiter(10, 60000); // 10 requestów na minutę

async generateFlashcards(...args): Promise<...> {
  await this.rateLimiter.acquire();
  // ... reszta implementacji
}
```

### 6.3 Sanitizacja Danych Wejściowych

Zawsze waliduj i sanityzuj dane wejściowe:

```typescript
private sanitizeSourceText(text: string): string {
  // Usuń znaki sterujące
  let sanitized = text.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Ogranicz długość
  const maxLength = 10000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
}
```

### 6.4 Logowanie Bezpieczne

Nigdy nie loguj wrażliwych danych:

```typescript
// ❌ ZŁE
console.log('API Request:', { apiKey: this.apiKey, body });

// ✅ DOBRE
console.log('API Request:', {
  apiKey: this.apiKey.substring(0, 8) + '...',
  bodyLength: JSON.stringify(body).length
});
```

### 6.5 HTTPS Only

Upewnij się, że wszystkie połączenia używają HTTPS:

```typescript
constructor(apiKey: string, options: OpenRouterServiceOptions = {}) {
  // ...
  const baseUrl = options.baseUrl || 'https://openrouter.ai/api/v1';
  
  if (!baseUrl.startsWith('https://')) {
    throw new Error('Base URL must use HTTPS protocol');
  }
  
  this.baseUrl = baseUrl;
}
```

## 7. Plan Wdrożenia Krok Po Kroku

### Krok 1: Przygotowanie Środowiska

#### 1.1 Instalacja Zależności
Nie są potrzebne dodatkowe zależności - używamy wbudowanego `fetch` API.

#### 1.2 Konfiguracja Zmiennych Środowiskowych

**Utwórz/zaktualizuj `.env`:**
```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

**Zaktualizuj `src/env.d.ts`:**
```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  // ... inne zmienne
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Dodaj do `.gitignore`:**
```
.env
.env.local
.env.production
```

### Krok 2: Utworzenie Typów i Schematów

#### 2.1 Utwórz/zaktualizuj `src/types.ts`

Dodaj typy specyficzne dla OpenRouter:

```typescript
// OpenRouter API Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
}

export interface ChatCompletionResponse<T = unknown> {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  parsed?: T;
}

export interface OpenRouterServiceOptions {
  baseUrl?: string;
  timeout?: number;
  httpReferer?: string;
  appTitle?: string;
  defaultModel?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface APICallOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface OpenRouterError extends Error {
  code: string;
  statusCode?: number;
  details?: unknown;
  retryable: boolean;
}
```

#### 2.2 Zaktualizuj `src/lib/schemas/generation.schema.ts`

Dodaj schemat dla propozycji fiszek (jeśli nie istnieje):

```typescript
import { z } from 'zod';

export const FlashcardProposalSchema = z.object({
  front: z.string()
    .min(1, 'Front cannot be empty')
    .max(200, 'Front cannot exceed 200 characters'),
  back: z.string()
    .min(1, 'Back cannot be empty')
    .max(500, 'Back cannot exceed 500 characters'),
});

export const FlashcardProposalsSchema = z.object({
  proposals: z.array(FlashcardProposalSchema)
    .min(1, 'Must generate at least 1 flashcard')
    .max(10, 'Cannot generate more than 10 flashcards'),
});

export type FlashcardProposalType = z.infer<typeof FlashcardProposalSchema>;
export type FlashcardProposalsType = z.infer<typeof FlashcardProposalsSchema>;
```

### Krok 3: Implementacja Error Factory

#### 3.1 Utwórz `src/lib/errors/openrouter.errors.ts`

```typescript
import type { OpenRouterError } from '@/types';

export class OpenRouterErrorFactory {
  static create(
    code: string,
    message: string,
    options: {
      statusCode?: number;
      details?: unknown;
      retryable?: boolean;
    } = {}
  ): OpenRouterError {
    const error = new Error(message) as OpenRouterError;
    error.code = code;
    error.statusCode = options.statusCode;
    error.details = options.details;
    error.retryable = options.retryable ?? false;
    error.name = 'OpenRouterError';
    
    // Zachowaj stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, OpenRouterErrorFactory.create);
    }
    
    return error;
  }
  
  static isOpenRouterError(error: unknown): error is OpenRouterError {
    return error instanceof Error && error.name === 'OpenRouterError';
  }
  
  static isRetryable(error: unknown): boolean {
    return this.isOpenRouterError(error) && error.retryable;
  }
}
```

### Krok 4: Implementacja Rate Limiter (opcjonalnie)

#### 4.1 Utwórz `src/lib/utils/rate-limiter.ts`

```typescript
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  
  constructor(maxRequests: number, windowMs: number) {
    if (maxRequests <= 0) {
      throw new Error('maxRequests must be greater than 0');
    }
    if (windowMs <= 0) {
      throw new Error('windowMs must be greater than 0');
    }
    
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  async acquire(): Promise<void> {
    const now = Date.now();
    
    // Usuń stare requesty poza oknem
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Jeśli osiągnięto limit, czekaj
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // +100ms buffer
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire(); // Rekurencyjnie spróbuj ponownie
    }
    
    // Dodaj obecny request
    this.requests.push(now);
  }
  
  reset(): void {
    this.requests = [];
  }
  
  get remainingRequests(): number {
    const now = Date.now();
    const recentRequests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}
```

### Krok 5: Implementacja OpenRouterService

#### 5.1 Utwórz plik `src/lib/services/openrouter.service.ts`

```typescript
import type {
  FlashcardProposalDTO,
  ChatMessage,
  ResponseFormat,
  OpenRouterServiceOptions,
  APICallOptions,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from '@/types';
import { FlashcardProposalsSchema } from '../schemas/generation.schema';
import { OpenRouterErrorFactory } from '../errors/openrouter.errors';
import { RateLimiter } from '../utils/rate-limiter';

/**
 * Service for interacting with OpenRouter.ai API
 * 
 * Provides methods to communicate with various LLM models through OpenRouter,
 * with built-in error handling, retry logic, and response validation.
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly httpReferer: string;
  private readonly appTitle: string;
  private readonly defaultModel: string;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;
  private readonly rateLimiter: RateLimiter;

  constructor(apiKey: string, options: OpenRouterServiceOptions = {}) {
    // Walidacja klucza API
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenRouter API key is required and cannot be empty');
    }
    
    this.apiKey = apiKey;
    
    // Walidacja i przypisanie baseUrl
    const baseUrl = options.baseUrl || 'https://openrouter.ai/api/v1';
    if (!baseUrl.startsWith('https://')) {
      throw new Error('Base URL must use HTTPS protocol');
    }
    this.baseUrl = baseUrl;
    
    // Walidacja i przypisanie timeout
    const timeout = options.timeout ?? 30000;
    if (timeout <= 0) {
      throw new Error('Timeout must be greater than 0');
    }
    this.timeout = timeout;
    
    // Walidacja i przypisanie retryAttempts
    const retryAttempts = options.retryAttempts ?? 2;
    if (retryAttempts < 0) {
      throw new Error('Retry attempts cannot be negative');
    }
    this.retryAttempts = retryAttempts;
    
    // Przypisanie pozostałych opcji
    this.retryDelay = options.retryDelay ?? 1000;
    this.httpReferer = options.httpReferer || 'https://10xcards.app';
    this.appTitle = options.appTitle || '10xCards Flashcard Generator';
    this.defaultModel = options.defaultModel || 'anthropic/claude-3.5-sonnet';
    
    // Inicjalizacja rate limitera: 60 requestów na minutę
    this.rateLimiter = new RateLimiter(60, 60000);
  }

  /**
   * Generate flashcard proposals from source text
   * 
   * @param sourceText - The text to generate flashcards from
   * @param model - Optional model name (defaults to defaultModel)
   * @returns Array of flashcard proposals
   * @throws OpenRouterError if generation fails
   */
  async generateFlashcards(
    sourceText: string,
    model?: string
  ): Promise<FlashcardProposalDTO[]> {
    // Walidacja wejściowa
    if (!sourceText || sourceText.trim() === '') {
      throw OpenRouterErrorFactory.create(
        'VALIDATION_ERROR',
        'Source text cannot be empty'
      );
    }
    
    const sanitizedText = this.sanitizeSourceText(sourceText);
    
    if (sanitizedText.length > 10000) {
      throw OpenRouterErrorFactory.create(
        'VALIDATION_ERROR',
        'Source text exceeds maximum length of 10000 characters'
      );
    }
    
    try {
      // Acquire rate limit slot
      await this.rateLimiter.acquire();
      
      // Buduj komunikaty i format odpowiedzi
      const systemMessage = this.buildSystemMessage();
      const userMessage = this.buildUserMessage(sanitizedText);
      const responseFormat = this.buildResponseFormat();
      
      // Wywołaj API
      const response = await this.callAPI(
        model || this.defaultModel,
        [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        { responseFormat, temperature: 0.7, maxTokens: 2000 }
      );
      
      // Parsuj i zwróć odpowiedź
      return this.parseResponse(response);
    } catch (error) {
      // Propaguj błędy OpenRouter
      if (OpenRouterErrorFactory.isOpenRouterError(error)) {
        throw error;
      }
      
      // Opakuj nieznane błędy
      throw OpenRouterErrorFactory.create(
        'OPENROUTER_UNKNOWN_ERROR',
        `Unexpected error during flashcard generation: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { details: error }
      );
    }
  }

  /**
   * Universal chat completion method
   * 
   * @param request - Chat completion request parameters
   * @returns Chat completion response
   * @throws OpenRouterError if request fails
   */
  async chat<T = unknown>(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse<T>> {
    // Walidacja
    if (!request.model) {
      throw OpenRouterErrorFactory.create(
        'VALIDATION_ERROR',
        'Model name is required'
      );
    }
    
    if (!request.messages || request.messages.length === 0) {
      throw OpenRouterErrorFactory.create(
        'VALIDATION_ERROR',
        'At least one message is required'
      );
    }
    
    try {
      await this.rateLimiter.acquire();
      
      const response = await this.callAPI(
        request.model,
        request.messages,
        {
          temperature: request.temperature,
          maxTokens: request.maxTokens,
          responseFormat: request.responseFormat,
          topP: request.topP,
          frequencyPenalty: request.frequencyPenalty,
          presencePenalty: request.presencePenalty,
        }
      );
      
      return response as ChatCompletionResponse<T>;
    } catch (error) {
      if (OpenRouterErrorFactory.isOpenRouterError(error)) {
        throw error;
      }
      
      throw OpenRouterErrorFactory.create(
        'OPENROUTER_UNKNOWN_ERROR',
        `Unexpected error during chat completion: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { details: error }
      );
    }
  }

  // ==================== Private Methods ====================

  /**
   * Build system message for flashcard generation
   */
  private buildSystemMessage(): string {
    return `You are an expert educational content creator specializing in creating effective flashcards for learning.

Your task is to analyze the provided text and generate high-quality flashcard proposals following these rules:

1. **Question Quality**:
   - Create clear, specific questions that test understanding
   - Avoid yes/no questions when possible
   - Focus on key concepts, definitions, and relationships
   - Length: 1-200 characters

2. **Answer Quality**:
   - Provide concise but complete answers
   - Include essential context when needed
   - Use clear, simple language
   - Length: 1-500 characters

3. **Quantity**:
   - Generate 3-10 flashcards depending on content richness
   - Prioritize quality over quantity
   - Avoid redundant or overlapping questions

4. **Content Coverage**:
   - Cover the most important concepts
   - Include definitions, processes, and relationships
   - Maintain factual accuracy

Return your response as a valid JSON object matching the provided schema.`;
  }

  /**
   * Build user message with source text
   */
  private buildUserMessage(sourceText: string): string {
    return `Generate flashcards from the following text:\n\n${sourceText}`;
  }

  /**
   * Build response format for structured JSON output
   */
  private buildResponseFormat(): ResponseFormat {
    return {
      type: 'json_schema',
      json_schema: {
        name: 'flashcard_proposals',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            proposals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  front: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 200,
                    description: 'The question or prompt on the front of the flashcard'
                  },
                  back: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 500,
                    description: 'The answer or explanation on the back of the flashcard'
                  }
                },
                required: ['front', 'back'],
                additionalProperties: false
              },
              minItems: 1,
              maxItems: 10
            }
          },
          required: ['proposals'],
          additionalProperties: false
        }
      }
    };
  }

  /**
   * Make low-level API call with retry logic
   */
  private async callAPI(
    model: string,
    messages: ChatMessage[],
    options: APICallOptions = {}
  ): Promise<unknown> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const requestBody = {
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
          ...(options.responseFormat && { response_format: options.responseFormat }),
          ...(options.topP !== undefined && { top_p: options.topP }),
          ...(options.frequencyPenalty !== undefined && { 
            frequency_penalty: options.frequencyPenalty 
          }),
          ...(options.presencePenalty !== undefined && { 
            presence_penalty: options.presencePenalty 
          }),
        };
        
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': this.httpReferer,
            'X-Title': this.appTitle,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || response.statusText;
          
          // Retry for transient errors
          if (this.shouldRetry(response.status, attempt)) {
            lastError = new Error(`API Error ${response.status}: ${errorMessage}`);
            await this.delay(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
            continue;
          }
          
          // Throw for non-retryable errors
          throw this.createAPIError(response.status, errorMessage);
        }
        
        const data = await response.json();
        return data;
        
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle timeout
        if (error instanceof Error && error.name === 'AbortError') {
          throw OpenRouterErrorFactory.create(
            'OPENROUTER_TIMEOUT',
            `Request exceeded ${this.timeout}ms timeout`,
            { retryable: false }
          );
        }
        
        // Retry for network errors
        if (this.isNetworkError(error) && attempt < this.retryAttempts) {
          lastError = error instanceof Error ? error : new Error('Network error');
          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }
        
        throw error;
      }
    }
    
    // All retries failed
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Determine if error qualifies for retry
   */
  private shouldRetry(statusCode: number, currentAttempt: number): boolean {
    if (currentAttempt >= this.retryAttempts) {
      return false;
    }
    
    // Retry for rate limit and server errors
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(statusCode);
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    
    const networkErrorTypes = [
      'NetworkError',
      'FetchError',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ];
    
    return networkErrorTypes.some(type => 
      error.name.includes(type) || error.message.includes(type)
    );
  }

  /**
   * Create specialized API error
   */
  private createAPIError(statusCode: number, message: string): Error {
    const errorMap: Record<number, { code: string; retryable: boolean }> = {
      400: { code: 'OPENROUTER_BAD_REQUEST', retryable: false },
      401: { code: 'OPENROUTER_UNAUTHORIZED', retryable: false },
      403: { code: 'OPENROUTER_FORBIDDEN', retryable: false },
      404: { code: 'OPENROUTER_NOT_FOUND', retryable: false },
      429: { code: 'OPENROUTER_RATE_LIMIT', retryable: true },
      500: { code: 'OPENROUTER_SERVER_ERROR', retryable: true },
      502: { code: 'OPENROUTER_BAD_GATEWAY', retryable: true },
      503: { code: 'OPENROUTER_SERVICE_UNAVAILABLE', retryable: true },
      504: { code: 'OPENROUTER_GATEWAY_TIMEOUT', retryable: true },
    };
    
    const errorInfo = errorMap[statusCode] || { 
      code: 'OPENROUTER_UNKNOWN_ERROR', 
      retryable: false 
    };
    
    return OpenRouterErrorFactory.create(
      errorInfo.code,
      message,
      { statusCode, retryable: errorInfo.retryable }
    );
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse and validate API response
   */
  private parseResponse(response: unknown): FlashcardProposalDTO[] {
    // Validate basic response structure
    if (!response || typeof response !== 'object') {
      throw OpenRouterErrorFactory.create(
        'OPENROUTER_INVALID_RESPONSE',
        'Response is not an object'
      );
    }
    
    const apiResponse = response as any;
    
    // Check for choices array
    if (!apiResponse.choices || !Array.isArray(apiResponse.choices) || 
        apiResponse.choices.length === 0) {
      throw OpenRouterErrorFactory.create(
        'OPENROUTER_INVALID_RESPONSE',
        'No choices in response'
      );
    }
    
    const firstChoice = apiResponse.choices[0];
    
    // Check for message content
    if (!firstChoice.message || !firstChoice.message.content) {
      throw OpenRouterErrorFactory.create(
        'OPENROUTER_INVALID_RESPONSE',
        'No message content in response'
      );
    }
    
    const content = firstChoice.message.content;
    
    // Parse JSON from content
    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      throw OpenRouterErrorFactory.create(
        'OPENROUTER_INVALID_JSON',
        `Failed to parse response content as JSON: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
    
    // Validate with Zod schema
    const validationResult = FlashcardProposalsSchema.safeParse(parsedContent);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw OpenRouterErrorFactory.create(
        'OPENROUTER_VALIDATION_ERROR',
        `Response validation failed: ${errors}`
      );
    }
    
    return validationResult.data.proposals;
  }

  /**
   * Sanitize source text input
   */
  private sanitizeSourceText(text: string): string {
    // Remove control characters
    let sanitized = text.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }
}
```

### Krok 6: Integracja z Generation Service

#### 6.1 Zaktualizuj `src/lib/services/generation.service.ts`

Zmodyfikuj istniejący GenerationService, aby używał nowego OpenRouterService:

```typescript
import type { 
  GenerationDTO, 
  FlashcardProposalDTO,
  CreateGenerationResponseDTO 
} from '@/types';
import { OpenRouterService } from './openrouter.service';
import { sha256Hash } from '../utils/crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export class GenerationService {
  private openRouterService: OpenRouterService;
  private supabase?: SupabaseClient;

  constructor(apiKey: string, supabase?: SupabaseClient) {
    this.openRouterService = new OpenRouterService(apiKey, {
      defaultModel: 'anthropic/claude-3.5-sonnet',
      timeout: 30000,
      retryAttempts: 2,
    });
    this.supabase = supabase;
  }

  async generateFlashcards(
    sourceText: string,
    userId?: string,
    model: string = 'anthropic/claude-3.5-sonnet'
  ): Promise<CreateGenerationResponseDTO> {
    const startTime = performance.now();
    
    // Hash source text
    const sourceTextHash = await sha256Hash(sourceText);
    
    try {
      // Generate flashcards using OpenRouter
      const proposals = await this.openRouterService.generateFlashcards(
        sourceText,
        model
      );
      
      // Calculate duration
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      // Create generation record in database (if supabase client provided)
      let generation: GenerationDTO;
      
      if (this.supabase && userId) {
        const { data, error } = await this.supabase
          .from('generations')
          .insert({
            user_id: userId,
            model: model,
            generated_count: proposals.length,
            accepted_unedited_count: 0,
            accepted_edited_count: 0,
            source_text_hash: sourceTextHash,
            source_text_length: sourceText.length,
            generation_duration: duration,
          })
          .select()
          .single();
        
        if (error) {
          throw new Error(`Failed to create generation record: ${error.message}`);
        }
        
        generation = {
          id: data.id,
          model: data.model,
          generated_count: data.generated_count,
          accepted_unedited_count: data.accepted_unedited_count,
          accepted_edited_count: data.accepted_edited_count,
          source_text_length: data.source_text_length,
          generation_duration: data.generation_duration,
          created_at: data.created_at,
        };
      } else {
        // Mock generation for development
        generation = {
          id: Math.floor(Math.random() * 10000),
          model: model,
          generated_count: proposals.length,
          accepted_unedited_count: 0,
          accepted_edited_count: 0,
          source_text_length: sourceText.length,
          generation_duration: duration,
          created_at: new Date().toISOString(),
        };
      }
      
      return {
        generation,
        proposals,
      };
      
    } catch (error) {
      // Log error to database if available
      if (this.supabase && userId) {
        await this.logGenerationError(
          userId,
          model,
          sourceTextHash,
          sourceText.length,
          error
        );
      }
      
      throw error;
    }
  }

  private async logGenerationError(
    userId: string,
    model: string,
    sourceTextHash: string,
    sourceTextLength: number,
    error: unknown
  ): Promise<void> {
    if (!this.supabase) return;
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any).code || 'UNKNOWN_ERROR';
    
    await this.supabase
      .from('generation_error_logs')
      .insert({
        user_id: userId,
        model: model,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        error_code: errorCode,
        error_message: errorMessage,
      });
  }
}
```

### Krok 7: Użycie w API Endpoint

#### 7.1 Przykład w `src/pages/api/generations/index.ts`

```typescript
import type { APIRoute } from 'astro';
import { GenerationService } from '@/lib/services/generation.service';
import { OpenRouterErrorFactory } from '@/lib/errors/openrouter.errors';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { source_text, model } = body;
    
    // Validate input
    if (!source_text) {
      return new Response(
        JSON.stringify({ error: 'source_text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user ID from locals (set by auth middleware)
    const userId = locals.userId; // Assume middleware sets this
    
    // Get OpenRouter API key from environment
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create service instance
    const generationService = new GenerationService(
      apiKey,
      locals.supabase // Assume middleware provides supabase client
    );
    
    // Generate flashcards
    const result = await generationService.generateFlashcards(
      source_text,
      userId,
      model
    );
    
    // Return result
    return new Response(
      JSON.stringify(result),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error generating flashcards:', error);
    
    // Handle OpenRouter errors specifically
    if (OpenRouterErrorFactory.isOpenRouterError(error)) {
      const openRouterError = error;
      
      // Return appropriate status based on error code
      const statusMap: Record<string, number> = {
        'VALIDATION_ERROR': 400,
        'OPENROUTER_UNAUTHORIZED': 401,
        'OPENROUTER_FORBIDDEN': 403,
        'OPENROUTER_RATE_LIMIT': 429,
        'OPENROUTER_TIMEOUT': 504,
      };
      
      const status = statusMap[openRouterError.code] || 500;
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate flashcards',
          code: openRouterError.code,
          message: openRouterError.message,
        }),
        { status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle unknown errors
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Krok 8: Testowanie

#### 8.1 Testy Jednostkowe (opcjonalne, ale zalecane)

Utwórz `src/lib/services/openrouter.service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenRouterService } from './openrouter.service';

describe('OpenRouterService', () => {
  let service: OpenRouterService;
  const mockApiKey = 'sk-or-v1-test-key';
  
  beforeEach(() => {
    service = new OpenRouterService(mockApiKey);
  });
  
  describe('Constructor', () => {
    it('should throw error for empty API key', () => {
      expect(() => new OpenRouterService('')).toThrow(
        'OpenRouter API key is required'
      );
    });
    
    it('should throw error for non-HTTPS base URL', () => {
      expect(() => new OpenRouterService(mockApiKey, {
        baseUrl: 'http://example.com'
      })).toThrow('Base URL must use HTTPS');
    });
    
    it('should throw error for invalid timeout', () => {
      expect(() => new OpenRouterService(mockApiKey, {
        timeout: -1
      })).toThrow('Timeout must be greater than 0');
    });
  });
  
  describe('generateFlashcards', () => {
    it('should throw validation error for empty source text', async () => {
      await expect(
        service.generateFlashcards('')
      ).rejects.toThrow('Source text cannot be empty');
    });
    
    it('should throw validation error for text exceeding max length', async () => {
      const longText = 'a'.repeat(10001);
      await expect(
        service.generateFlashcards(longText)
      ).rejects.toThrow('exceeds maximum length');
    });
    
    // Add more tests for successful calls with mocked fetch
  });
});
```

#### 8.2 Testy Integracyjne

Utwórz plik testowy `tests/openrouter-integration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { OpenRouterService } from '../src/lib/services/openrouter.service';

// Skip jeśli brak klucza API
const apiKey = process.env.OPENROUTER_API_KEY;
const describeIf = apiKey ? describe : describe.skip;

describeIf('OpenRouter Integration Tests', () => {
  it('should generate flashcards from sample text', async () => {
    const service = new OpenRouterService(apiKey!);
    
    const sourceText = `
      Fotosynteza jest procesem biologicznym, w którym rośliny przekształcają 
      energię świetlną w energię chemiczną. Proces ten zachodzi w chloroplastach 
      i wymaga obecności chlorofilu, dwutlenku węgla i wody.
    `;
    
    const proposals = await service.generateFlashcards(sourceText);
    
    expect(proposals).toBeDefined();
    expect(Array.isArray(proposals)).toBe(true);
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals.length).toBeLessThanOrEqual(10);
    
    proposals.forEach(proposal => {
      expect(proposal.front).toBeDefined();
      expect(proposal.back).toBeDefined();
      expect(proposal.front.length).toBeGreaterThan(0);
      expect(proposal.front.length).toBeLessThanOrEqual(200);
      expect(proposal.back.length).toBeGreaterThan(0);
      expect(proposal.back.length).toBeLessThanOrEqual(500);
    });
  }, 60000); // 60s timeout dla testu integracyjnego
});
```

### Krok 9: Dokumentacja i Przykłady Użycia

#### 9.1 Dodaj do README lub utwórz dedykowaną dokumentację

```markdown
## OpenRouter Service

### Podstawowe użycie

```typescript
import { OpenRouterService } from '@/lib/services/openrouter.service';

// Inicjalizacja
const apiKey = import.meta.env.OPENROUTER_API_KEY;
const service = new OpenRouterService(apiKey);

// Generowanie fiszek
const proposals = await service.generateFlashcards(
  "Tekst źródłowy do nauki...",
  "anthropic/claude-3.5-sonnet"
);
```

### Zaawansowane użycie

```typescript
// Inicjalizacja z opcjami
const service = new OpenRouterService(apiKey, {
  timeout: 45000,           // 45 sekund
  retryAttempts: 3,         // 3 próby
  defaultModel: 'anthropic/claude-3.5-sonnet',
  httpReferer: 'https://myapp.com',
});

// Uniwersalne wywołanie chat
const response = await service.chat({
  model: 'openai/gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum physics.' }
  ],
  temperature: 0.8,
  maxTokens: 1000,
});
```

### Obsługa błędów

```typescript
import { OpenRouterErrorFactory } from '@/lib/errors/openrouter.errors';

try {
  const proposals = await service.generateFlashcards(sourceText);
} catch (error) {
  if (OpenRouterErrorFactory.isOpenRouterError(error)) {
    console.error('OpenRouter Error:', error.code, error.message);
    
    if (error.retryable) {
      // Można spróbować ponownie później
    }
  } else {
    console.error('Unknown error:', error);
  }
}
```
```

### Krok 10: Deployment Checklist

Przed wdrożeniem upewnij się, że:

- [ ] Zmienna środowiskowa `OPENROUTER_API_KEY` jest ustawiona w środowisku produkcyjnym
- [ ] `.env` jest dodany do `.gitignore`
- [ ] Nie ma hardcoded'owanych kluczy API w kodzie
- [ ] Logi nie zawierają wrażliwych danych (pełnych kluczy API, tekstów użytkowników)
- [ ] Rate limiting jest włączony
- [ ] Timeout jest odpowiednio skonfigurowany
- [ ] Obsługa błędów jest kompletna
- [ ] Testy jednostkowe przechodzą
- [ ] Testy integracyjne przechodzą (jeśli dostępne)
- [ ] Dokumentacja jest aktualna

---

## Podsumowanie

Ten plan implementacji dostarcza kompletnego przewodnika do wdrożenia usługi OpenRouter w projekcie 10xCards. Implementacja obejmuje:

1. **Solidną architekturę** - Separation of concerns, single responsibility
2. **Bezpieczeństwo** - HTTPS only, API key protection, input sanitization
3. **Niezawodność** - Retry logic, timeout handling, rate limiting
4. **Walidację** - Input validation, response validation with Zod
5. **Elastyczność** - Configurable options, universal chat method
6. **Obsługę błędów** - Comprehensive error handling with specific error types
7. **Testowalność** - Clear separation for unit and integration testing
8. **Dokumentację** - Clear examples and usage guidelines

Serwis jest gotowy do produkcji i zapewnia solidną podstawę do komunikacji z API OpenRouter.
