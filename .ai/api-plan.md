# REST API Plan for 10x-Cards

## 1. Resources

The API exposes the following main resources mapped to database tables:

| Resource | Database Table | Description |
|----------|---------------|-------------|
| `/api/flashcards` | `flashcards` | User's flashcard collection (manual, AI-generated, or AI-edited) |
| `/api/generations` | `generations` | AI generation sessions and their metadata/statistics |
| `/api/auth` | `users` (via Supabase Auth) | User authentication and account management |

**Note:** `generation_error_logs` table is used internally for logging and monitoring but not exposed as a public API resource.

## 2. Endpoints

### 2.1 Authentication Endpoints

Authentication is handled by Supabase Auth. The application uses Supabase's client-side SDK for authentication operations. The following operations are supported:

- **Sign Up**: `supabase.auth.signUp()`
- **Sign In**: `supabase.auth.signInWithPassword()`
- **Sign Out**: `supabase.auth.signOut()`
- **Get Session**: `supabase.auth.getSession()`

All other API endpoints require a valid JWT token from Supabase Auth passed in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

### 2.2 Flashcards Resource

#### 2.2.1 List Flashcards

**Endpoint:** `GET /api/flashcards`

**Description:** Retrieves a paginated list of the authenticated user's flashcards.

**Query Parameters:**
- `page` (integer, optional, default: 1) - Page number
- `limit` (integer, optional, default: 20, max: 100) - Number of items per page
- `sort` (string, optional, default: "created_at") - Sort field: `created_at`, `updated_at`, `front`
- `order` (string, optional, default: "desc") - Sort order: `asc`, `desc`
- `source` (string, optional) - Filter by source: `ai-full`, `ai-edited`, `manual`
- `search` (string, optional) - Search in front and back fields

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "front": "What is REST API?",
      "back": "Representational State Transfer Application Programming Interface",
      "source": "manual",
      "generation_id": null,
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript",
      "source": "ai-full",
      "generation_id": 5,
      "created_at": "2026-01-16T14:20:00Z",
      "updated_at": "2026-01-16T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```
- `400 Bad Request` - Invalid query parameters
```json
{
  "error": "Bad Request",
  "message": "Invalid limit value. Must be between 1 and 100"
}
```

---

#### 2.2.2 Get Single Flashcard

**Endpoint:** `GET /api/flashcards/{id}`

**Description:** Retrieves a single flashcard by ID. Only returns flashcards owned by the authenticated user.

**Path Parameters:**
- `id` (integer, required) - Flashcard ID

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "front": "What is REST API?",
  "back": "Representational State Transfer Application Programming Interface",
  "source": "manual",
  "generation_id": null,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Flashcard not found or not owned by user
```json
{
  "error": "Not Found",
  "message": "Flashcard not found"
}
```

---

#### 2.2.3 Create Single Flashcard (Manual)

**Endpoint:** `POST /api/flashcards`

**Description:** Creates a single flashcard manually (not from AI generation).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "front": "What is REST API?",
  "back": "Representational State Transfer Application Programming Interface"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "front": "What is REST API?",
  "back": "Representational State Transfer Application Programming Interface",
  "source": "manual",
  "generation_id": null,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `400 Bad Request` - Validation error
```json
{
  "error": "Validation Error",
  "message": "Validation failed",
  "details": [
    {
      "field": "front",
      "message": "Front is required and must be 1-200 characters"
    },
    {
      "field": "back",
      "message": "Back is required and must be 1-500 characters"
    }
  ]
}
```

---

#### 2.2.4 Create Multiple Flashcards (Batch)

**Endpoint:** `POST /api/flashcards/batch`

**Description:** Creates multiple flashcards at once. Used when accepting flashcards from AI generation. Updates generation statistics automatically.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "generation_id": 5,
  "flashcards": [
    {
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript",
      "edited": false
    },
    {
      "front": "What is Astro?",
      "back": "A modern static site generator optimized for speed",
      "edited": true
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "created_count": 2,
  "flashcards": [
    {
      "id": 10,
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript",
      "source": "ai-full",
      "generation_id": 5,
      "created_at": "2026-01-16T14:20:00Z",
      "updated_at": "2026-01-16T14:20:00Z"
    },
    {
      "id": 11,
      "front": "What is Astro?",
      "back": "A modern static site generator optimized for speed",
      "source": "ai-edited",
      "generation_id": 5,
      "created_at": "2026-01-16T14:20:00Z",
      "updated_at": "2026-01-16T14:20:00Z"
    }
  ]
}
```

**Business Logic:**
- Automatically sets `source` to `ai-full` if `edited: false`
- Automatically sets `source` to `ai-edited` if `edited: true`
- Updates `accepted_unedited_count` and `accepted_edited_count` in the `generations` table
- Verifies that `generation_id` belongs to the authenticated user

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `400 Bad Request` - Validation error
```json
{
  "error": "Validation Error",
  "message": "All flashcards must have valid front and back fields"
}
```
- `404 Not Found` - Generation not found
```json
{
  "error": "Not Found",
  "message": "Generation with ID 5 not found"
}
```

---

#### 2.2.5 Update Flashcard

**Endpoint:** `PATCH /api/flashcards/{id}`

**Description:** Updates an existing flashcard. Only allows updating flashcards owned by the authenticated user.

**Path Parameters:**
- `id` (integer, required) - Flashcard ID

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "front": "What is a REST API?",
  "back": "Representational State Transfer - an architectural style for APIs"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "front": "What is a REST API?",
  "back": "Representational State Transfer - an architectural style for APIs",
  "source": "ai-edited",
  "generation_id": 5,
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-16T09:15:00Z"
}
```

**Business Logic:**
- If flashcard `source` was `ai-full`, it is changed to `ai-edited` upon update
- `updated_at` timestamp is automatically updated via database trigger
- Only `front` and `back` fields can be updated

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Flashcard not found or not owned by user
- `400 Bad Request` - Validation error
```json
{
  "error": "Validation Error",
  "message": "Front must be 1-200 characters"
}
```

---

#### 2.2.6 Delete Flashcard

**Endpoint:** `DELETE /api/flashcards/{id}`

**Description:** Permanently deletes a flashcard. Only allows deleting flashcards owned by the authenticated user.

**Path Parameters:**
- `id` (integer, required) - Flashcard ID

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "message": "Flashcard deleted successfully",
  "id": 1
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Flashcard not found or not owned by user
```json
{
  "error": "Not Found",
  "message": "Flashcard not found"
}
```

---

### 2.3 Generations Resource

#### 2.3.1 Create Generation (Generate Flashcards from Text)

**Endpoint:** `POST /api/generations`

**Description:** Generates flashcard proposals from provided text using an LLM via Openrouter.ai. Creates a generation record and returns proposed flashcards without saving them to the flashcards table.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "source_text": "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing to the language, which can help catch errors early and improve code quality. TypeScript is developed and maintained by Microsoft...",
  "model": "anthropic/claude-3.5-sonnet"
}
```

**Response (201 Created):**
```json
{
  "generation": {
    "id": 5,
    "model": "anthropic/claude-3.5-sonnet",
    "generated_count": 8,
    "accepted_unedited_count": 0,
    "accepted_edited_count": 0,
    "source_text_hash": "a3f8d9c2e1b7f4a6",
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
      "back": "It adds optional static typing which helps catch errors early and improve code quality"
    },
    {
      "front": "Who develops TypeScript?",
      "back": "Microsoft"
    }
  ]
}
```

**Business Logic:**
- Validates that `source_text` is between 1000 and 10000 characters
- Calculates SHA-256 hash of `source_text` for tracking
- Calls LLM API via Openrouter.ai
- Records generation duration in milliseconds
- Creates `generation` record in database
- If LLM call fails, creates record in `generation_error_logs` table
- Returns proposed flashcards without saving them to flashcards table
- User will later accept/reject proposals via `/api/flashcards/batch` endpoint

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `400 Bad Request` - Validation error
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
- `429 Too Many Requests` - Rate limit exceeded
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many generation requests. Please try again later",
  "retry_after": 60
}
```
- `500 Internal Server Error` - LLM API error
```json
{
  "error": "Generation Failed",
  "message": "Failed to generate flashcards from the provided text",
  "details": "LLM API returned an error"
}
```

---

#### 2.3.2 List Generations

**Endpoint:** `GET /api/generations`

**Description:** Retrieves a paginated list of the authenticated user's generation history with statistics.

**Query Parameters:**
- `page` (integer, optional, default: 1) - Page number
- `limit` (integer, optional, default: 20, max: 100) - Number of items per page
- `sort` (string, optional, default: "created_at") - Sort field: `created_at`, `model`
- `order` (string, optional, default: "desc") - Sort order: `asc`, `desc`
- `model` (string, optional) - Filter by model name

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 5,
      "model": "anthropic/claude-3.5-sonnet",
      "generated_count": 8,
      "accepted_unedited_count": 5,
      "accepted_edited_count": 2,
      "source_text_length": 2450,
      "generation_duration": 3200,
      "created_at": "2026-01-16T14:18:00Z"
    },
    {
      "id": 4,
      "model": "openai/gpt-4",
      "generated_count": 10,
      "accepted_unedited_count": 7,
      "accepted_edited_count": 1,
      "source_text_length": 3500,
      "generation_duration": 4100,
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "total_pages": 1
  },
  "statistics": {
    "total_generations": 12,
    "total_flashcards_generated": 95,
    "total_flashcards_accepted": 68,
    "acceptance_rate": 0.716
  }
}
```

**Note:** `source_text_hash` is intentionally excluded from the response for security reasons.

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `400 Bad Request` - Invalid query parameters

---

#### 2.3.3 Get Single Generation

**Endpoint:** `GET /api/generations/{id}`

**Description:** Retrieves detailed information about a specific generation. Only returns generations owned by the authenticated user.

**Path Parameters:**
- `id` (integer, required) - Generation ID

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "id": 5,
  "model": "anthropic/claude-3.5-sonnet",
  "generated_count": 8,
  "accepted_unedited_count": 5,
  "accepted_edited_count": 2,
  "source_text_length": 2450,
  "generation_duration": 3200,
  "created_at": "2026-01-16T14:18:00Z",
  "flashcards": [
    {
      "id": 10,
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript",
      "source": "ai-full",
      "created_at": "2026-01-16T14:20:00Z"
    },
    {
      "id": 11,
      "front": "What is Astro?",
      "back": "A modern static site generator",
      "source": "ai-edited",
      "created_at": "2026-01-16T14:20:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Generation not found or not owned by user
```json
{
  "error": "Not Found",
  "message": "Generation not found"
}
```

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **JWT (JSON Web Token)** authentication provided by Supabase Auth:

1. **Token Generation**: When a user signs up or logs in via Supabase Auth, they receive a JWT token
2. **Token Usage**: The client must include the JWT token in the `Authorization` header of all API requests:
   ```
   Authorization: Bearer <jwt_token>
   ```
3. **Token Validation**: Each API endpoint validates the JWT token using Supabase's verification methods
4. **Token Refresh**: Supabase Auth automatically handles token refresh via its client SDK

### 3.2 Implementation in Astro Middleware

Authentication is implemented in Astro middleware (`src/middleware/index.ts`):

```typescript
// Pseudocode for middleware
export async function onRequest(context, next) {
  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401 
    });
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401 
    });
  }
  
  // Attach user to context
  context.locals.user = user;
  context.locals.userId = user.id;
  
  return next();
}
```

### 3.3 Row-Level Security (RLS)

Authorization is enforced through PostgreSQL Row-Level Security policies:

1. **Flashcards Table**: Users can only access flashcards where `user_id = auth.uid()`
2. **Generations Table**: Users can only access generations where `user_id = auth.uid()`
3. **Generation Error Logs**: Users can only access logs where `user_id = auth.uid()`

RLS policies are defined in database migrations and act as a second layer of defense alongside application-level checks.

### 3.4 API Endpoint Protection

All API endpoints (except public health checks) require authentication:

- **Protected Routes**: All routes under `/api/flashcards` and `/api/generations`
- **User ID Injection**: Authenticated `user_id` is automatically injected into database queries
- **Ownership Validation**: For single-resource operations (GET, PATCH, DELETE), the API verifies that the resource belongs to the authenticated user

### 3.5 Security Best Practices

1. **No User ID in Request Body**: The `user_id` is never accepted from client requests; it's always extracted from the authenticated JWT token
2. **SQL Injection Prevention**: All queries use parameterized statements via Supabase client
3. **Rate Limiting**: Generation endpoint has rate limiting to prevent abuse and control costs
4. **HTTPS Only**: All API communication must use HTTPS in production
5. **CORS Configuration**: Properly configured CORS headers to allow only the frontend domain

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Flashcards

| Field | Validation Rules |
|-------|-----------------|
| `front` | Required, string, 1-200 characters |
| `back` | Required, string, 1-500 characters |
| `source` | Auto-generated, must be one of: `ai-full`, `ai-edited`, `manual` |
| `user_id` | Auto-injected from JWT, UUID format |
| `generation_id` | Optional, must reference valid generation owned by user, integer |

#### Generations

| Field | Validation Rules |
|-------|-----------------|
| `source_text` | Required, string, 1000-10000 characters (validated before hashing) |
| `model` | Required, string, must be a valid Openrouter.ai model identifier |
| `user_id` | Auto-injected from JWT, UUID format |
| `source_text_hash` | Auto-generated, SHA-256 hash |
| `source_text_length` | Auto-calculated, integer, 1000-10000 |
| `generation_duration` | Auto-calculated, integer (milliseconds) |
| `generated_count` | Auto-populated from LLM response, integer, > 0 |

### 4.2 Business Logic Implementation

#### 4.2.1 AI Flashcard Generation Flow

1. **Request Validation**:
   - Validate source text length (1000-10000 characters)
   - Validate model identifier
   - Check user's rate limit status

2. **Pre-Processing**:
   - Calculate text length
   - Generate SHA-256 hash of source text
   - Record start timestamp

3. **LLM API Call**:
   - Send request to Openrouter.ai with structured prompt
   - Handle timeout (e.g., 30 seconds)
   - Parse LLM response into structured flashcard proposals

4. **Success Path**:
   - Calculate generation duration
   - Create `generation` record with metadata
   - Return generation info and proposals to client
   - Proposals are NOT saved to flashcards table yet

5. **Error Path**:
   - Calculate duration until failure
   - Create `generation_error_logs` record with error details
   - Return error response to client

#### 4.2.2 Flashcard Acceptance Flow

1. **Batch Creation Request**:
   - Validate all flashcard data (front/back length)
   - Verify `generation_id` exists and belongs to user
   - Check `edited` flag for each flashcard

2. **Database Operations** (in transaction):
   - Create flashcard records with appropriate `source` value:
     - `ai-full` if `edited: false`
     - `ai-edited` if `edited: true`
   - Update generation record:
     - Increment `accepted_unedited_count` for each `ai-full` flashcard
     - Increment `accepted_edited_count` for each `ai-edited` flashcard

3. **Response**:
   - Return created flashcards with IDs and timestamps

#### 4.2.3 Flashcard Edit Flow

1. **Update Request**:
   - Validate flashcard ID and ownership
   - Validate new front/back values

2. **Source Transition Logic**:
   - If current `source` is `ai-full`, change to `ai-edited`
   - If current `source` is `ai-edited`, remain `ai-edited`
   - If current `source` is `manual`, remain `manual`

3. **Database Operations**:
   - Update flashcard with new values
   - `updated_at` timestamp auto-updated by database trigger

#### 4.2.4 Statistics Calculation

Statistics are calculated on-demand when listing generations:

```typescript
// Pseudocode
acceptance_rate = 
  (total_accepted_unedited + total_accepted_edited) / 
  total_generated_count

total_generated_count = SUM(generated_count) across all generations
total_accepted = SUM(accepted_unedited_count + accepted_edited_count)
```

### 4.3 Error Handling Strategy

#### Client Errors (4xx)

- **400 Bad Request**: Validation errors, malformed JSON, invalid parameters
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Resource doesn't exist or user doesn't have access
- **429 Too Many Requests**: Rate limit exceeded

All 4xx responses include structured error information:
```json
{
  "error": "Error Type",
  "message": "Human-readable message",
  "details": {}  // Optional additional context
}
```

#### Server Errors (5xx)

- **500 Internal Server Error**: Unexpected server errors, database errors
- **502 Bad Gateway**: LLM API unavailable
- **503 Service Unavailable**: Temporary outage

Server errors are logged with full context but return minimal information to client:
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "request_id": "uuid-for-tracking"
}
```

### 4.4 Rate Limiting

**Generation Endpoint Rate Limits:**
- **Per User**: 10 requests per hour
- **Global**: 1000 requests per hour (to control API costs)

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1642348800
```

When rate limit is exceeded:
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many generation requests. Please try again later",
  "retry_after": 3600
}
```

### 4.5 Data Integrity and Constraints

#### Database-Level Constraints

1. **Foreign Key Constraints**:
   - `flashcards.user_id` must reference valid `users.id`
   - `flashcards.generation_id` can be NULL or reference valid `generations.id`
   - ON DELETE SET NULL for `generation_id` (flashcards remain if generation deleted)

2. **Check Constraints**:
   - `flashcards.source` must be in ('ai-full', 'ai-edited', 'manual')
   - `generations.source_text_length` must be between 1000 and 10000
   - `generation_error_logs.source_text_length` must be between 1000 and 10000

3. **Unique Constraints**:
   - `users.email` must be unique (enforced by Supabase Auth)

4. **NOT NULL Constraints**:
   - All required fields have NOT NULL constraints at database level

#### Application-Level Validation

Before database operations, the API validates:
- String lengths match database limits
- Enum values are valid
- Required fields are present
- Data types are correct
- User has permission to access/modify resource

---

## 5. Additional Considerations

### 5.1 Pagination Standard

All list endpoints follow consistent pagination:

**Request:**
```
GET /api/flashcards?page=2&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 95,
    "total_pages": 5,
    "has_next": true,
    "has_prev": true
  }
}
```

### 5.2 API Versioning

For MVP, no versioning is implemented. Future versions should use URL versioning:
```
/api/v1/flashcards
/api/v2/flashcards
```

### 5.3 CORS Configuration

```javascript
// Allowed origins
const allowedOrigins = [
  'http://localhost:4321',  // Astro dev server
  'https://10xcards.com',   // Production domain
];

// CORS headers
Access-Control-Allow-Origin: <origin>
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### 5.4 Response Time Targets

- **CRUD Operations**: < 200ms (p95)
- **List Endpoints**: < 500ms (p95)
- **Generation Endpoint**: < 10s (p95) - depends on LLM API

### 5.5 Logging and Monitoring

**Logged Events:**
- All API requests (method, path, user_id, status, duration)
- Authentication failures
- Validation errors
- Generation requests (text_length, model, duration, success/failure)
- Rate limit violations
- Database errors

**Monitoring Metrics:**
- Request rate by endpoint
- Error rate by endpoint and type
- Generation success rate
- Average generation duration
- LLM API costs per model
- User engagement (generations per user, flashcards per user)

---

## 6. Implementation Notes

### 6.1 Technology-Specific Considerations

**Astro API Routes:**
- API endpoints implemented as files in `/src/pages/api/`
- File structure:
  ```
  /src/pages/api/
    flashcards/
      index.ts          # GET, POST /api/flashcards
      [id].ts           # GET, PATCH, DELETE /api/flashcards/{id}
      batch.ts          # POST /api/flashcards/batch
    generations/
      index.ts          # GET, POST /api/generations
      [id].ts           # GET /api/generations/{id}
  ```

**Supabase Integration:**
- Use Supabase JavaScript client for all database operations
- Leverage RLS policies for authorization
- Use Supabase Auth for JWT validation

**TypeScript Types:**
- Define all request/response types in `/src/types.ts`
- Use shared types between API and frontend
- Generate database types from Supabase schema

### 6.2 Future Enhancements (Post-MVP)

1. **Webhooks**: Notify external services of events
2. **Bulk Operations**: Import/export flashcards
3. **Search**: Full-text search across flashcards
4. **Tags/Categories**: Organize flashcards by topic
5. **Sharing**: Share flashcard decks with other users
6. **Study Sessions API**: Track study progress and statistics
7. **Analytics Dashboard**: Detailed usage analytics
8. **GraphQL API**: Alternative to REST for complex queries

---

## 7. Summary

This REST API plan provides a comprehensive foundation for the 10x-cards application. It:

✅ Covers all user stories from the PRD
✅ Implements proper authentication and authorization
✅ Enforces validation rules from the database schema
✅ Handles AI generation workflow with proper error handling
✅ Provides statistics tracking for product metrics
✅ Follows REST best practices and standards
✅ Includes proper error handling and rate limiting
✅ Considers scalability and performance
✅ Is compatible with the chosen tech stack (Astro, Supabase, Openrouter.ai)

The API is designed to be secure, scalable, and maintainable while supporting the MVP requirements and allowing for future enhancements.
