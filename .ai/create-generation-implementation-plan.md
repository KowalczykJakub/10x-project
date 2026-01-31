# API Endpoint Implementation Plan: Create Generation

## 1. Endpoint Overview

**Endpoint:** `POST /api/generations`

**Purpose:** Generate flashcard proposals from user-provided text using a Large Language Model (LLM) via Openrouter.ai. This endpoint creates a generation record in the database to track the generation session and returns AI-proposed flashcards without persisting them to the flashcards table. Users will later accept or reject these proposals through the batch flashcard creation endpoint.

**Key Features:**
- Accepts text input between 1000-10000 characters
- Calls LLM via Openrouter.ai to generate flashcard proposals
- Records generation metadata (model, duration, count, hash)
- Returns proposals for user review and acceptance
- Logs errors to `generation_error_logs` table on LLM failures
- Validates input and enforces rate limits

---

## 2. Request Details

### HTTP Method
`POST`

### URL Structure
```
POST /api/generations
```

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  "source_text": "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing to the language, which can help catch errors early and improve code quality..."
}
```

### Parameters

#### Required Parameters
- **source_text** (string, in body)
  - Description: The text content from which to generate flashcards
  - Validation:
    - Minimum length: 1000 characters
    - Maximum length: 10000 characters
    - Must not be empty or only whitespace after trimming
  - Example: Educational text, article content, lecture notes, etc.

#### Authentication
- **JWT Token** (required, in Authorization header)
  - Format: `Bearer <token>`
  - Used to extract `user_id` for database operations and RLS enforcement

---

## 3. Used Types

### Request DTOs
- **CreateGenerationDTO**
  - Purpose: Validate and type the incoming request body
  - Fields:
    - `source_text: string` (1000-10000 characters)

### Response DTOs
- **CreateGenerationResponseDTO**
  - Purpose: Structure the successful response
  - Fields:
    - `generation: GenerationDTO` - Generation metadata
    - `proposals: FlashcardProposalDTO[]` - Array of proposed flashcards

- **GenerationDTO**
  - Purpose: Represent generation record (excludes sensitive fields)
  - Fields:
    - `id: number`
    - `model: string`
    - `generated_count: number`
    - `accepted_unedited_count: number`
    - `accepted_edited_count: number`
    - `source_text_length: number`
    - `generation_duration: number` (milliseconds)
    - `created_at: string` (ISO 8601 timestamp)

- **FlashcardProposalDTO**
  - Purpose: Represent a single AI-proposed flashcard
  - Fields:
    - `front: string`
    - `back: string`

### Internal/Database DTOs
- **GenerationInsertDTO**
  - Purpose: Insert new generation record into database
  - Fields:
    - `user_id: string` (UUID from JWT)
    - `model: string`
    - `generated_count: number`
    - `accepted_unedited_count: number` (initially 0)
    - `accepted_edited_count: number` (initially 0)
    - `source_text_hash: string` (SHA-256)
    - `source_text_length: number`
    - `generation_duration: number` (milliseconds)

- **GenerationErrorLogInsertDTO**
  - Purpose: Log generation errors for monitoring
  - Fields:
    - `user_id: string` (UUID)
    - `model: string`
    - `source_text_hash: string`
    - `source_text_length: number`
    - `error_code: string`
    - `error_message: string`

### Error Response DTOs
- **ErrorResponseDTO**
  - Fields:
    - `error: string` (error type)
    - `message: string` (human-readable message)
    - `details?: unknown` (optional additional context)

- **ValidationErrorResponseDTO**
  - Extends ErrorResponseDTO
  - Fields:
    - `error: "Validation Error"`
    - `message: string`
    - `details: ValidationErrorDetailDTO[]`

---

## 4. Response Details

### Success Response (201 Created)
```json
{
  "generation": {
    "id": 5,
    "model": "anthropic/claude-3.5-sonnet",
    "generated_count": 8,
    "accepted_unedited_count": 0,
    "accepted_edited_count": 0,
    "source_text_length": 2450,
    "generation_duration": 3200,
    "created_at": "2026-01-16T14:18:00Z"
  },
  "proposals": [
    {
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript that compiles to plain JavaScript"
    },
    {
      "front": "What is the main benefit of TypeScript?",
      "back": "It adds optional static typing which helps catch errors early"
    },
    {
      "front": "Who develops TypeScript?",
      "back": "Microsoft"
    }
  ]
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": "Validation Error",
  "message": "Source text must be between 1000 and 10000 characters",
  "details": {
    "current_length": 850,
    "min_length": 1000,
    "max_length": 10000
  }
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many generation requests. Please try again later",
  "retry_after": 60
}
```

#### 500 Internal Server Error - LLM API Failure
```json
{
  "error": "Generation Failed",
  "message": "Failed to generate flashcards from the provided text",
  "details": "LLM API returned an error"
}
```

#### 500 Internal Server Error - Configuration Error
```json
{
  "error": "Configuration Error",
  "message": "Service configuration error. Please contact support."
}
```

---

## 5. Data Flow

### High-Level Flow
```
1. Client Request
   ↓
2. Astro API Route Handler (src/pages/api/generations/index.ts)
   ↓
3. Middleware Authentication (verify JWT, extract user_id)
   ↓
4. Input Validation (Zod schema validation)
   ↓
5. GenerationService.generateFlashcards()
   ├─→ Hash source text (SHA-256)
   ├─→ Start timer
   ├─→ OpenRouterService.generateFlashcards()
   │   ├─→ Build prompt for LLM
   │   ├─→ Call Openrouter.ai API
   │   └─→ Parse and validate LLM response
   ├─→ Stop timer (calculate duration)
   ├─→ Create GenerationInsertDTO
   ├─→ Insert generation record to database
   └─→ Return GenerationDTO + proposals
   ↓
6. Format Response (201 Created)
   ↓
7. Return to Client
```

### Detailed Data Flow Steps

#### Step 1: Request Reception
- Astro API route receives POST request
- Extract `source_text` from request body
- Extract JWT from Authorization header

#### Step 2: Authentication
- Verify JWT token validity using Supabase client
- Extract `user_id` from validated token
- If invalid: Return 401 Unauthorized

#### Step 3: Input Validation
- Validate request body against Zod schema:
  ```typescript
  {
    source_text: z.string()
      .min(1000, 'Source text must be at least 1000 characters')
      .max(10000, 'Source text must not exceed 10000 characters')
      .trim()
  }
  ```
- If validation fails: Return 400 Bad Request with details

#### Step 4: Rate Limiting (Optional but Recommended)
- Check if user has exceeded rate limits (e.g., 10 requests per hour)
- Implementation options:
  - Use Redis for distributed rate limiting
  - Use in-memory cache for simple rate limiting
  - Query recent generations from database
- If exceeded: Return 429 Too Many Requests

#### Step 5: Generation Service Orchestration
- Call `GenerationService.generateFlashcards(sourceText, userId, model)`
- Service performs:
  1. Calculate SHA-256 hash of source_text
  2. Start performance timer
  3. Call OpenRouter API via OpenRouterService
  4. Receive and validate proposals
  5. Stop timer and calculate duration
  6. Prepare generation insert data
  7. Insert generation record into database
  8. Return generation metadata + proposals

#### Step 6: LLM API Communication (OpenRouterService)
- Build system prompt with instructions for flashcard generation
- Construct API request to Openrouter.ai:
  ```typescript
  {
    model: "anthropic/claude-3.5-sonnet",
    messages: [
      {
        role: "system",
        content: "Generate flashcards from the provided text..."
      },
      {
        role: "user",
        content: sourceText
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  }
  ```
- Make HTTP POST request to Openrouter.ai
- Handle API errors (timeout, rate limit, API errors)
- Parse response and extract flashcard proposals
- Validate proposal structure:
  - Each proposal must have `front` and `back`
  - Front: 1-200 characters
  - Back: 1-500 characters

#### Step 7: Database Operations
- Insert generation record:
  ```sql
  INSERT INTO generations (
    user_id, model, generated_count,
    accepted_unedited_count, accepted_edited_count,
    source_text_hash, source_text_length,
    generation_duration
  ) VALUES (...)
  RETURNING *;
  ```
- Use Supabase client from `context.locals.supabase`
- RLS policy ensures user_id matches authenticated user

#### Step 8: Error Handling
- If LLM API fails:
  1. Log error to `generation_error_logs` table
  2. Return 500 error to client
  3. Include generic error message (don't expose internal details)

- Error log insertion:
  ```sql
  INSERT INTO generation_error_logs (
    user_id, model, source_text_hash,
    source_text_length, error_code, error_message
  ) VALUES (...)
  ```

#### Step 9: Response Formatting
- Map database `GenerationEntity` to `GenerationDTO` (exclude sensitive fields)
- Combine generation metadata with proposals
- Return 201 Created with `CreateGenerationResponseDTO`

---

## 6. Security Considerations

### Authentication & Authorization
1. **JWT Validation**
   - Verify JWT token on every request
   - Use Supabase's `getUser()` method to validate and extract user data
   - Reject requests with missing, expired, or invalid tokens (401)

2. **Row-Level Security (RLS)**
   - Enable RLS on `generations` table
   - Policy: `user_id = auth.uid()` ensures users can only access their own generations
   - Same for `generation_error_logs`

### Input Validation & Sanitization
1. **Source Text Validation**
   - Enforce length constraints (1000-10000 chars) at multiple layers:
     - Zod schema validation (API layer)
     - Database CHECK constraint (data layer)
   - Trim whitespace before validation
   - Reject empty or whitespace-only text

2. **LLM Injection Prevention**
   - Use well-defined system prompts with clear boundaries
   - Treat user input as untrusted data in prompts
   - Consider prompt injection detection patterns
   - Sanitize any special characters that could break prompt structure

3. **Output Validation**
   - Validate LLM response structure before returning to user
   - Ensure flashcard proposals meet length requirements
   - Sanitize HTML/script content if proposals will be rendered in UI

### API Security
1. **API Key Protection**
   - Store Openrouter API key in environment variables
   - Access via `import.meta.env.OPENROUTER_API_KEY`
   - Never log or expose API keys in responses
   - Use server-side only environment variables

2. **Rate Limiting**
   - Implement per-user rate limits to prevent abuse
   - Suggested: 10 generations per hour per user
   - Return 429 with `retry_after` header when exceeded
   - Consider tiered limits based on user plan (future enhancement)

3. **CORS & Headers**
   - Set appropriate CORS headers
   - Use `Content-Type: application/json` for all requests/responses
   - Set security headers (CSP, X-Content-Type-Options, etc.)

### Data Privacy
1. **Source Text Handling**
   - **DO NOT** store raw source text in database (privacy concern)
   - Store SHA-256 hash for deduplication and tracking
   - Store only metadata (length, hash)

2. **Sensitive Data in Logs**
   - Do not log source text content
   - Do not log flashcard content in production
   - Log only metadata (lengths, timestamps, user IDs)

3. **Error Messages**
   - Return generic error messages to clients
   - Log detailed errors server-side only
   - Don't expose internal system details (API keys, database structure, etc.)

### Cost Control
1. **LLM Usage Monitoring**
   - Track generation counts per user
   - Monitor token usage and costs
   - Set spending limits on Openrouter.ai dashboard
   - Consider implementing user quotas

2. **Request Size Limits**
   - 10000 character limit prevents excessive token usage
   - Each request should cost ~2000-3000 tokens (estimation)

---

## 7. Error Handling

### Error Categories and Handling Strategy

#### 1. Authentication Errors (401)
**Scenarios:**
- Missing Authorization header
- Invalid JWT token format
- Expired JWT token
- Token signature verification failure

**Handling:**
- Return immediately with 401 status
- Generic message: "Authentication required"
- Do not process request further
- Do not log to generation_error_logs (not a generation error)

**Implementation:**
```typescript
if (!user) {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'Authentication required'
    }),
    { status: 401 }
  );
}
```

#### 2. Validation Errors (400)
**Scenarios:**
- source_text missing from request body
- source_text too short (< 1000 chars)
- source_text too long (> 10000 chars)
- source_text is empty or only whitespace
- Invalid JSON in request body
- Wrong Content-Type header

**Handling:**
- Use Zod schema validation
- Return 400 with detailed validation errors
- Include field-specific error messages
- Do not log to generation_error_logs (user error, not system error)

**Implementation:**
```typescript
const validation = CreateGenerationSchema.safeParse(body);
if (!validation.success) {
  return new Response(
    JSON.stringify({
      error: 'Validation Error',
      message: validation.error.errors[0].message,
      details: {
        current_length: body.source_text?.length || 0,
        min_length: 1000,
        max_length: 10000
      }
    }),
    { status: 400 }
  );
}
```

#### 3. Rate Limiting Errors (429)
**Scenarios:**
- User exceeds allowed generation requests per time period
- Suggested limit: 10 requests per hour

**Handling:**
- Check recent generation count before processing
- Return 429 with `retry_after` information
- Include rate limit details in response

**Implementation:**
```typescript
const recentGenerations = await checkRateLimit(userId);
if (recentGenerations >= RATE_LIMIT) {
  return new Response(
    JSON.stringify({
      error: 'Rate Limit Exceeded',
      message: 'Too many generation requests. Please try again later',
      retry_after: 60 // seconds
    }),
    {
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    }
  );
}
```

#### 4. LLM API Errors (500)
**Scenarios:**
- Openrouter.ai API is down or unreachable
- API request timeout (> 30 seconds)
- API returns error response (rate limit, authentication, etc.)
- Model specified is unavailable
- LLM response is malformed or unparseable

**Handling:**
- Log error to `generation_error_logs` table
- Return generic 500 error to client
- Include error code for debugging
- Retry logic for transient failures (optional)

**Error Codes:**
- `LLM_API_TIMEOUT`: Request took too long
- `LLM_API_ERROR`: API returned error response
- `LLM_PARSE_ERROR`: Response couldn't be parsed
- `LLM_MODEL_UNAVAILABLE`: Specified model not available

**Implementation:**
```typescript
try {
  const proposals = await openRouterService.generateFlashcards(sourceText, model);
} catch (error) {
  // Log to generation_error_logs
  await logGenerationError({
    user_id: userId,
    model: model,
    source_text_hash: hash,
    source_text_length: sourceText.length,
    error_code: 'LLM_API_ERROR',
    error_message: error.message
  });

  return new Response(
    JSON.stringify({
      error: 'Generation Failed',
      message: 'Failed to generate flashcards from the provided text',
      details: 'Service temporarily unavailable'
    }),
    { status: 500 }
  );
}
```

#### 5. Database Errors (500)
**Scenarios:**
- Failed to insert generation record
- Database connection failure
- RLS policy violation (shouldn't happen with correct auth)
- Database constraint violation

**Handling:**
- Log error server-side with full details
- Return generic 500 error to client
- Consider retry for transient failures
- Alert operations team for persistent failures

**Implementation:**
```typescript
try {
  const { data, error } = await supabase
    .from('generations')
    .insert(generationData)
    .select()
    .single();

  if (error) throw error;
} catch (error) {
  console.error('Database error:', error);
  return new Response(
    JSON.stringify({
      error: 'Internal Server Error',
      message: 'Failed to save generation record'
    }),
    { status: 500 }
  );
}
```

#### 6. Configuration Errors (500)
**Scenarios:**
- Openrouter API key not configured (missing env variable)
- Invalid API key format
- Database connection string missing

**Handling:**
- Check configuration on service initialization
- Return 500 with generic message to client
- Log detailed configuration error server-side
- Alert operations team immediately

**Implementation:**
```typescript
if (!import.meta.env.OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY not configured');
  return new Response(
    JSON.stringify({
      error: 'Configuration Error',
      message: 'Service configuration error. Please contact support.'
    }),
    { status: 500 }
  );
}
```

### Error Logging Strategy

**What to Log:**
- Timestamp
- User ID
- Model name
- Source text hash (NOT the actual text)
- Source text length
- Error code (categorized)
- Error message (detailed)

**Where to Log:**
1. **generation_error_logs table** (for LLM failures)
   - Used for analytics and monitoring
   - Queryable for debugging patterns
   
2. **Application logs** (for all errors)
   - Console/file logs for operations
   - Include request ID for tracing
   - Include stack traces for 500 errors

**What NOT to Log:**
- Source text content (privacy)
- JWT tokens or API keys (security)
- Flashcard content in production (privacy)

---

## 8. Performance Considerations

### Potential Bottlenecks

1. **LLM API Latency**
   - **Issue**: Openrouter.ai API calls can take 2-10 seconds
   - **Impact**: User waits for response, poor UX if too slow
   - **Mitigation**:
     - Set reasonable timeout (30 seconds)
     - Show loading indicator on frontend
     - Consider async/queue-based processing for better UX (future enhancement)

2. **Database Write Performance**
   - **Issue**: Inserting generation record adds latency
   - **Impact**: Minimal (~10-50ms) but adds to total request time
   - **Mitigation**:
     - Use database indexes on user_id, created_at
     - Consider write-behind caching (future optimization)

3. **Hashing Performance**
   - **Issue**: SHA-256 hashing of large text (10000 chars)
   - **Impact**: Minimal (~1-5ms) but measurable
   - **Mitigation**:
     - Use native crypto libraries (Web Crypto API or Node crypto)
     - Hash is unavoidable for deduplication

4. **Rate Limit Checking**
   - **Issue**: Querying recent generations on every request
   - **Impact**: Adds database query overhead
   - **Mitigation**:
     - Use Redis for fast rate limit checks (recommended)
     - Use in-memory cache with TTL
     - Create optimized database index on (user_id, created_at)

### Optimization Strategies

1. **Efficient Database Queries**
   - Use indexes:
     ```sql
     CREATE INDEX idx_generations_user_created 
     ON generations(user_id, created_at DESC);
     ```
   - Use `select()` to fetch only needed columns
   - Use `.single()` for single row queries

2. **Prompt Engineering**
   - Optimize LLM prompt for faster responses:
     - Clear, concise instructions
     - Request specific format (JSON)
     - Limit number of flashcards generated (e.g., 5-10)

3. **Response Size Optimization**
   - Exclude unnecessary fields from GenerationDTO
   - Compress response if large (gzip)
   - Limit proposal count to reasonable number

4. **Caching Strategies**
   - **Source text hash deduplication**: Check if same text was recently generated
     - If hash exists in recent generations, could return cached proposals
     - Requires storing proposals temporarily (Redis/cache)
     - Significantly improves UX for duplicate requests
   - **Model metadata caching**: Cache available models list
   - **Rate limit caching**: Cache user rate limit status in Redis

5. **Async Processing (Future Enhancement)**
   - Make API call asynchronous:
     1. Immediately return 202 Accepted with generation ID
     2. Process LLM call in background
     3. Client polls for completion or uses WebSocket
   - Benefits: Better UX, can handle longer timeouts, queue-based scaling

### Monitoring and Metrics

**Key Metrics to Track:**
1. **Request Duration**
   - Total endpoint execution time
   - LLM API call duration
   - Database operation duration

2. **Success Rate**
   - Percentage of successful generations
   - Track by model, time of day, user

3. **Error Rate**
   - Categorized by error type
   - Track LLM API failures separately

4. **Token Usage**
   - Track average tokens per request
   - Monitor costs per model

5. **Rate Limit Hits**
   - How often users hit rate limits
   - Adjust limits based on usage patterns

**Alerting:**
- Alert if error rate > 5%
- Alert if average duration > 15 seconds
- Alert if LLM API is consistently failing

---

## 9. Implementation Steps

### Step 1: Environment Setup
1. Add Openrouter.ai API key to environment variables:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```
2. Update `src/env.d.ts` with environment variable types:
   ```typescript
   interface ImportMetaEnv {
     readonly OPENROUTER_API_KEY: string;
     // ... other env vars
   }
   ```

### Step 2: Create Validation Schema
**File:** `src/lib/schemas/generation.schema.ts`

```typescript
import { z } from 'zod';

export const CreateGenerationSchema = z.object({
  source_text: z
    .string()
    .trim()
    .min(1000, 'Source text must be at least 1000 characters')
    .max(10000, 'Source text must not exceed 10000 characters')
    .refine(
      (text) => text.replace(/\s/g, '').length > 0,
      'Source text cannot be empty or contain only whitespace'
    ),
});

export type CreateGenerationInput = z.infer<typeof CreateGenerationSchema>;
```

### Step 3: Create OpenRouter Service
**File:** `src/lib/services/openrouter.service.ts`

**Responsibilities:**
- Communicate with Openrouter.ai API
- Build prompts for flashcard generation
- Parse and validate LLM responses
- Handle API errors and timeouts

**Key Methods:**
```typescript
class OpenRouterService {
  // Generate flashcards from source text
  async generateFlashcards(
    sourceText: string,
    model: string = 'anthropic/claude-3.5-sonnet'
  ): Promise<FlashcardProposalDTO[]>

  // Build system prompt for flashcard generation
  private buildPrompt(sourceText: string): string

  // Make API call to Openrouter
  private async callAPI(prompt: string, model: string): Promise<unknown>

  // Parse and validate LLM response
  private parseResponse(response: unknown): FlashcardProposalDTO[]
}
```

**Implementation Notes:**
- Use `fetch` for API calls
- Set timeout to 30 seconds
- Validate response structure with Zod
- Throw descriptive errors for different failure scenarios

### Step 4: Create Generation Service
**File:** `src/lib/services/generation.service.ts`

**Responsibilities:**
- Orchestrate generation workflow
- Hash source text
- Measure generation duration
- Insert generation records
- Log errors to database
- Coordinate with OpenRouter service

**Key Methods:**
```typescript
class GenerationService {
  // Main orchestration method
  async generateFlashcards(
    sourceText: string,
    userId: string,
    model: string
  ): Promise<{ generation: GenerationDTO; proposals: FlashcardProposalDTO[] }>

  // Hash source text using SHA-256
  async hashSourceText(text: string): Promise<string>

  // Create generation record in database
  private async createGenerationRecord(
    data: GenerationInsertDTO
  ): Promise<GenerationEntity>

  // Log generation error to database
  async logGenerationError(
    data: GenerationErrorLogInsertDTO
  ): Promise<void>

  // Map GenerationEntity to GenerationDTO
  private mapToDTO(entity: GenerationEntity): GenerationDTO
}
```

**Implementation Notes:**
- Use Web Crypto API for SHA-256 hashing
- Use `performance.now()` for duration measurement
- Use Supabase client for database operations
- Handle all error scenarios with proper logging

### Step 5: Create Rate Limiting Utility (Optional but Recommended)
**File:** `src/lib/utils/rate-limiter.ts`

```typescript
// Simple in-memory rate limiter
// For production, consider Redis-based solution

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  async checkLimit(userId: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }>

  async recordRequest(userId: string): Promise<void>
}
```

### Step 6: Create API Route Handler
**File:** `src/pages/api/generations/index.ts`

**Structure:**
```typescript
import type { APIRoute } from 'astro';
import { CreateGenerationSchema } from '@/lib/schemas/generation.schema';
import { GenerationService } from '@/lib/services/generation.service';
import type { CreateGenerationResponseDTO, ErrorResponseDTO } from '@/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Authentication
  const supabase = locals.supabase;
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required'
      } as ErrorResponseDTO),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid JSON in request body'
      } as ErrorResponseDTO),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const validation = CreateGenerationSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return new Response(
      JSON.stringify({
        error: 'Validation Error',
        message: firstError.message,
        details: {
          current_length: body.source_text?.length || 0,
          min_length: 1000,
          max_length: 10000
        }
      } as ErrorResponseDTO),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Rate limiting (optional)
  // const rateLimitCheck = await rateLimiter.checkLimit(user.id);
  // if (!rateLimitCheck.allowed) { ... return 429 ... }

  // 4. Generate flashcards
  const generationService = new GenerationService(supabase);
  try {
    const result = await generationService.generateFlashcards(
      validation.data.source_text,
      user.id,
      'anthropic/claude-3.5-sonnet' // Default model
    );

    return new Response(
      JSON.stringify(result as CreateGenerationResponseDTO),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    // Error handling with appropriate status codes
    // ... (see error handling section)
    return new Response(
      JSON.stringify({
        error: 'Generation Failed',
        message: 'Failed to generate flashcards from the provided text'
      } as ErrorResponseDTO),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Step 7: Add Utility Functions
**File:** `src/lib/utils/crypto.ts`

```typescript
// SHA-256 hashing utility
export async function sha256Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
```

### Step 8: Update TypeScript Environment Types
**File:** `src/env.d.ts`

Add Openrouter API key type:
```typescript
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
}
```

### Step 9: Testing Strategy

**Unit Tests:**
1. Test Zod schema validation with various inputs
2. Test OpenRouter service prompt building
3. Test response parsing logic
4. Test SHA-256 hashing utility
5. Test rate limiter logic

**Integration Tests:**
1. Test full generation flow with mock LLM responses
2. Test error scenarios (API failures, timeouts)
3. Test database insertion and retrieval
4. Test error logging to generation_error_logs

**Manual Testing:**
1. Test with valid source text (1000-10000 chars)
2. Test with text < 1000 chars (should fail validation)
3. Test with text > 10000 chars (should fail validation)
4. Test without authentication (should return 401)
5. Test rate limiting (make multiple requests quickly)
6. Test with Openrouter API key removed (should fail gracefully)

### Step 10: Documentation

1. **Update API documentation** with:
   - Request/response examples
   - Error codes and meanings
   - Rate limit information
   - Model options (if configurable)

2. **Add code comments** explaining:
   - Why source text is hashed (privacy)
   - Generation duration measurement
   - Error logging strategy

3. **Document environment variables** needed:
   - OPENROUTER_API_KEY

4. **Create developer guide** for:
   - Adding new models
   - Adjusting rate limits
   - Debugging generation failures

### Step 11: Deployment Checklist

- [ ] Environment variables configured in production
- [ ] Database indexes created for performance
- [ ] RLS policies enabled on generations table
- [ ] Openrouter.ai API key has spending limits set
- [ ] Error logging is working correctly
- [ ] Rate limiting is enabled
- [ ] Monitoring and alerting set up
- [ ] API documentation published
- [ ] Frontend integration tested

---

## 10. Additional Considerations

### Model Selection Strategy
**Current:** Hard-coded default model (`anthropic/claude-3.5-sonnet`)

**Future Enhancement:** Allow user to select model
- Add optional `model` field to `CreateGenerationDTO`
- Validate model against allowed list
- Track model usage and costs
- Offer different pricing tiers per model

### Duplicate Detection
**Consideration:** Should we prevent duplicate generations?
- Check if source_text_hash already exists in recent generations
- If found, offer to return cached results instead
- Trade-off: Better UX vs. limiting user flexibility

### Prompt Engineering Best Practices
**Recommended System Prompt Structure:**
```
You are a flashcard generator. Generate 5-10 flashcards from the provided text.

Requirements:
- Each flashcard must have a "front" (question) and "back" (answer)
- Front should be 10-200 characters
- Back should be 10-500 characters
- Questions should be clear and specific
- Answers should be concise but complete
- Focus on key concepts and important information

Return the flashcards as a JSON array with this structure:
[
  { "front": "question text", "back": "answer text" },
  ...
]
```

### Future Enhancements
1. **Async processing with webhooks/polling**
2. **Flashcard quality scoring**
3. **Custom model selection per request**
4. **Batch text processing (multiple sources)**
5. **Duplicate detection and caching**
6. **A/B testing different prompts**
7. **User feedback loop for improving prompts**
8. **Cost tracking and usage analytics dashboard**
