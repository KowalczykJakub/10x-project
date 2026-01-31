# UI Architecture Planning Summary - 10x-Cards MVP

## Conversation Summary

This document summarizes the UI architecture planning session for the 10x-Cards MVP application. The planning process involved analyzing the Product Requirements Document (PRD), tech stack, and API plan to create a simplified, implementation-ready UI architecture.

---

## Decisions Made by User

1. **Onboarding**: Optional/can be included - simple onboarding welcome for new users
2. **Navigation**: Sidebar navigation (instead of top navbar or bottom bar)
3. **Proposal Acceptance UI**: Simplest possible approach
4. **Rate Limiting Display**: Simplest possible approach (reactive, not proactive)
5. **Study Session Location**: Directly integrated in the application (not separate page/modal)
6. **Flashcards List Features**: Basic functionality only
7. **Proposal State Management**: Simplest possible approach (local state only)
8. **Generation History**: Simple history view is sufficient
9. **Error Handling**: Modal for critical errors, toast for success messages
10. **Overall Complexity**: "Everything as simple as possible"

---

## Matched Recommendations

Based on user decisions, the following simplified recommendations were adopted:

### 1. Navigation Structure
- **Collapsible sidebar** with icons + text in expanded state, icons only in collapsed
- Toggle button in top corner
- Mobile: overlay sidebar with backdrop (hamburger menu trigger)
- Active state highlighting with accent color + bold text
- **No breadcrumb navigation** (flat structure, unnecessary for MVP)

### 2. Proposal Acceptance Flow (Simplest)
- **Table/list layout** instead of cards: `[Checkbox | Front | Back | Edit Button]`
- Inline editing when "Edit" clicked
- Bottom action: "Save Selected Flashcards" button
- Uses Shadcn/ui Table component for quick implementation and built-in responsiveness

### 3. Rate Limiting (Reactive Only)
- **No proactive counter/tracker**
- Display error message only when 429 API response occurs
- Toast/alert with message: "Exceeded generation limit (10/hour). Try again in X minutes"
- Uses `retry_after` from API response

### 4. Proposal State Management (Simplest)
- **Local React state only** - no session storage
- Proposals stored in component state after API generation
- Simple `window.onbeforeunload` alert: "You have unsaved flashcard proposals. Are you sure you want to leave?"
- Acceptable data loss on page refresh for MVP

### 5. Error Handling Strategy
- **Critical errors** (401, 500): Modal dialogs with action buttons
  - 401: "Session expired" + "Log in again" button
  - 500: "Error occurred" + "Retry" / "Contact" buttons
- **Non-critical errors** (400, 429, network): Toast notifications
  - 400: Toast with API message
  - 429: Toast with retry time
  - Success: Toast confirmations
- Uses Shadcn/ui: AlertDialog (critical), Toast (non-critical)

### 6. Flashcards List (Basic Features)
- **Sorting dropdown**: "Newest", "Oldest", "A-Z"
- **Filter dropdown**: "All", "AI", "Manual"
- **No search bar** in MVP (can be added post-MVP)
- Pagination: 20 items/page with previous/next buttons
- Table layout: `[Front | Back | Source | Actions: Edit/Delete]`

### 7. Generation History (Simple View)
- **Simple table layout**: `[Date | Model | Generated | Accepted | Acceptance Rate %]`
- Summary cards at top: "Total generations: X", "Average acceptance rate: Y%"
- Sort by date (newest first, default)
- Pagination: 20/page
- **No drilldown** to individual generation details (GET `/api/generations/{id}` unused in MVP)

### 8. Manual Flashcard Creation
- **Modal dialog** (not inline form or separate page)
- Opens via "+ New Flashcard" button in "My Flashcards" view
- Simple form: textarea "Front" (200 chars max + counter), textarea "Back" (500 chars max + counter)
- Buttons: "Save", "Cancel"
- After save: close modal, refresh list, show success toast

### 9. Loading States (Simple)
- **AI Generation**: Spinner overlay + "Generating flashcards..." text
- **Button actions**: Button disabled + inline spinner icon
- **List loading**: Simple "Loading..." text in content area
- **No skeleton screens** (nice-to-have, not critical for MVP)

### 10. Onboarding (Optional, Simple)
- Post-registration modal with 2-3 slides:
  1. "Paste text → Generate flashcards"
  2. "Accept/Edit proposals"
  3. "Start learning"
- "Next" / "Start" button
- Checkbox: "Don't show again"

---

## UI Architecture Planning Summary

### Main Architecture Requirements

**Framework & Libraries:**
- Astro 5 for static pages and routing
- React 19 for interactive components
- TypeScript 5 for type safety
- Tailwind 4 for styling
- Shadcn/ui for component library

**Design Principles:**
- Maximum simplicity for MVP
- Minimal custom components
- Leverage Shadcn/ui components heavily
- Flat navigation structure
- Responsive-first approach using Tailwind breakpoints

---

### Key Views and Screens

#### View 1: Authentication (Landing Page)
**Purpose:** User login and registration

**Components:**
- Toggle between login/register forms
- Email + password input fields
- Submit buttons: "Log In" / "Register"
- Error handling via inline validation

**Shadcn/ui Components:** Input, Button, Card

**API Integration:**
- Supabase Auth SDK for authentication
- JWT token storage in browser
- Redirect to "Generate Flashcards" on success

---

#### View 2: Generate Flashcards (Main View After Login)
**Purpose:** AI-powered flashcard generation from text

**Layout - Input Phase:**
- Large textarea for source text (1000-10000 characters)
- Real-time character counter with color coding:
  - Red: < 1000 (invalid)
  - Yellow: 1000-2000 (ok)
  - Green: 2000-9000 (optimal)
  - Orange: 9000-10000 (near limit)
- "Generate Flashcards" button (disabled when validation fails)
- Loading overlay with spinner during API call

**Layout - Proposal Review Phase:**
- Table/list of generated proposals
- Columns: `[Checkbox | Front (truncated) | Back (truncated) | Edit Button]`
- Inline editing mode: textarea fields for front/back, save/cancel buttons
- Bottom section: "Save Selected Flashcards" button
- Display count: "Selected: X/Y"

**Shadcn/ui Components:** Textarea, Button, Table, Checkbox

**API Integration:**
1. `POST /api/generations` - Generate proposals (returns generation_id + proposals array)
2. Store proposals in local React state
3. User reviews/edits proposals
4. `POST /api/flashcards/batch` - Save accepted flashcards with generation_id and edited flags

**State Management:**
- Local component state for proposals
- `onbeforeunload` warning for unsaved changes
- Clear state after successful save

**Error Handling:**
- 400 Validation: Toast with character count details
- 429 Rate Limit: Toast with retry time from API
- 500 Server Error: Modal with retry option

---

#### View 3: My Flashcards
**Purpose:** Browse, manage, and manually create flashcards

**Layout:**
- Action bar at top:
  - "+ New Flashcard" button (opens modal)
  - Sort dropdown: "Newest", "Oldest", "A-Z"
  - Filter dropdown: "All", "AI", "Manual"
- Table display: `[Front | Back | Source | Actions]`
  - Actions: Edit icon button, Delete icon button
- Pagination controls at bottom: Previous/Next, page info "Page X of Y"

**Modal - New/Edit Flashcard:**
- Textarea: "Front" (max 200 chars, with counter)
- Textarea: "Back" (max 500 chars, with counter)
- Buttons: "Save", "Cancel"

**Delete Confirmation:**
- Simple AlertDialog: "Are you sure you want to delete this flashcard?"
- Buttons: "Cancel", "Delete"

**Shadcn/ui Components:** Button, Table, Dialog, Textarea, AlertDialog, Select

**API Integration:**
- `GET /api/flashcards?page=X&limit=20&sort=created_at&order=desc&source=all` - List flashcards
- `POST /api/flashcards` - Create manual flashcard
- `PATCH /api/flashcards/{id}` - Update flashcard
- `DELETE /api/flashcards/{id}` - Delete flashcard

**State Management:**
- Fetch on mount and after any CRUD operation
- Local state for current page, filters, sort options
- Optimistic UI updates optional (can just refetch for simplicity)

**Error Handling:**
- 400 Validation: Toast with field errors
- 404 Not Found: Toast "Flashcard not found"
- Success: Toast "Flashcard saved/deleted successfully"

---

#### View 4: Study Session
**Purpose:** Spaced repetition learning session

**Layout (Full-page, Immersive):**
- Exit button (X) in top-right corner
- Progress bar at top: "Card X of Y"
- Large centered card displaying flashcard front
- "Show Answer" button (centered, prominent)
- After revealing answer:
  - Display back content
  - Self-assessment buttons: "Hard", "Medium", "Easy"
- Transition to next card after assessment

**Design Notes:**
- Minimal distractions - no sidebar during session
- Large, readable font for flashcard content
- Smooth transitions between cards
- End-of-session summary: "Session complete! X cards reviewed"

**Shadcn/ui Components:** Card, Button, Progress

**API Integration:**
- Integration with external spaced repetition algorithm library (e.g., `ts-fsrs`)
- `GET /api/flashcards` - Fetch user's flashcards for session
- Local algorithm determines which cards to show and when
- Store review results locally or in future `reviews` table (post-MVP)

**State Management:**
- Session state: current card index, cards queue, algorithm state
- Local storage for algorithm data persistence

---

#### View 5: Generation History
**Purpose:** Track AI generation statistics and success metrics

**Layout:**
- Summary cards at top (horizontal row):
  - "Total Generations: X"
  - "Average Acceptance Rate: Y%"
- Table below: `[Date | Model | Generated | Accepted | Acceptance Rate %]`
- Sort by date (newest first by default)
- Pagination: 20/page

**Shadcn/ui Components:** Card, Table

**API Integration:**
- `GET /api/generations?page=X&limit=20&sort=created_at&order=desc` - List generations
- Response includes pagination and statistics

**State Management:**
- Fetch on mount
- Local state for current page
- No real-time updates needed

---

#### View 6: Profile (Minimal)
**Purpose:** User account management

**Layout:**
- Display user email (read-only)
- "Log Out" button
- (Future: account deletion, settings)

**Shadcn/ui Components:** Card, Button

**API Integration:**
- Supabase Auth SDK for logout
- Clear local auth state
- Redirect to login page

---

### Navigation Flow

**Sidebar Menu Structure:**
```
┌─────────────────────┐
│ [Logo] [≡]         │ ← Toggle button
├─────────────────────┤
│ 🎯 Generate         │ ← Active state: accent bg + bold
│ 📚 My Flashcards    │
│ 🎓 Study Session    │
│ 📊 History          │
│ 👤 Profile          │
└─────────────────────┘
```

**User Journey - First Time:**
1. Land on login/register page
2. Register account → (optional onboarding modal)
3. Redirected to "Generate Flashcards" view
4. Paste text → Generate → Review proposals → Save
5. Navigate to "Study Session" → Start learning

**User Journey - Returning:**
1. Login
2. View dashboard/generate page
3. Access any section via sidebar

---

### API Integration Strategy

**Authentication Flow:**
- Supabase Auth handles JWT generation and refresh
- Store token in localStorage/cookie via Supabase SDK
- Astro middleware validates token on API routes
- Attach `Authorization: Bearer <token>` header to all API requests

**Data Fetching Pattern:**
- Fetch on component mount (useEffect)
- Refetch after mutations (create, update, delete)
- No global state management library (keep it simple)
- Loading states: boolean flag in component state

**Error Response Handling:**
```typescript
// Pseudocode pattern
try {
  const response = await fetch('/api/flashcards', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 401) {
      // Critical: show modal, force logout
      showAuthModal();
    } else if (response.status >= 400 && response.status < 500) {
      // Non-critical: show toast
      showToast(error.message);
    } else {
      // Server error: show modal with retry
      showErrorModal(error.message);
    }
    
    return;
  }
  
  const data = await response.json();
  setState(data);
} catch (e) {
  // Network error
  showToast('Connection problem. Please try again.');
}
```

**Pagination Implementation:**
- Track `currentPage` in component state
- Build query string: `?page=${currentPage}&limit=20`
- Display controls based on `pagination.total_pages` from API response

**Form Validation:**
- Client-side validation before API call (character counts, required fields)
- Display validation errors inline (red text under field)
- Server-side validation errors from 400 responses shown in toast

---

### State Management Strategy

**Approach:** Keep It Simple - Local Component State

**Rationale:**
- MVP doesn't require complex global state
- Most data is view-specific
- Refetching after mutations is acceptable performance-wise
- Avoid overhead of Redux/Zustand/etc.

**Implementation:**

1. **Auth State:**
   - Managed by Supabase Auth SDK
   - Access via `supabase.auth.getSession()`
   - Share via Context API if needed across components

2. **View-Specific State:**
   - Each view manages its own data
   - Fetch on mount, refetch after changes
   - Local loading/error flags

3. **Proposal Editing State:**
   - Store proposals array in local state after generation
   - Track which proposals are selected (checkbox state)
   - Track edited values (controlled form inputs)
   - Clear after successful batch save

4. **Study Session State:**
   - Current card index
   - Cards queue from algorithm
   - Algorithm internal state (last review dates, ease factors, etc.)
   - Persist algorithm state in localStorage

**No State Management Library Required**

---

### Responsiveness Strategy

**Breakpoints (Tailwind defaults):**
- Mobile: < 768px
- Desktop: ≥ 768px

**Responsive Patterns:**

**Sidebar:**
- Mobile: Hidden by default, overlay on hamburger click, backdrop dismiss
- Desktop: Visible, collapsible to icon-only

**Tables:**
- Mobile: Consider card layout for better mobile UX (optional for MVP, can keep scrollable table)
- Desktop: Full table layout

**Forms:**
- Stack vertically on all screen sizes
- Full-width inputs on mobile
- Constrained width on desktop (max-w-xl)

**Modals:**
- Full-screen on mobile (or near full-screen)
- Centered with max-width on desktop

**Study Session:**
- Full-page on all devices
- Adjust card font size for readability

**Implementation:**
```jsx
// Example: Sidebar responsive
<aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg 
                  transform transition-transform
                  lg:translate-x-0
                  ${isOpen ? 'translate-x-0' : '-translate-x-full'}">
  {/* Sidebar content */}
</aside>
```

---

### Accessibility Considerations

**Keyboard Navigation:**
- All interactive elements accessible via Tab key
- Focus visible indicators (Tailwind: `focus:ring-2`)
- Modal trap focus (Shadcn/ui Dialog handles this)
- Escape key closes modals

**Screen Reader Support:**
- Semantic HTML (nav, main, aside, article)
- ARIA labels for icon-only buttons
- ARIA live regions for toast notifications
- Alt text for any images (logo, etc.)

**Color and Contrast:**
- WCAG AA contrast ratios minimum
- Don't rely solely on color (use icons + text)
- Character counter: color + text description

**Form Accessibility:**
- Label elements associated with inputs
- Error messages announced to screen readers
- Required fields marked with asterisk + aria-required

**Implementation:**
```jsx
// Example: Accessible button
<button
  aria-label="Delete flashcard"
  className="..."
>
  <TrashIcon className="h-5 w-5" />
</button>
```

**Shadcn/ui Benefit:**
- Components built with accessibility in mind
- Proper ARIA attributes included by default

---

### Security Considerations

**Authentication:**
- JWT tokens managed by Supabase (httpOnly cookies preferred)
- Never store sensitive data in localStorage if avoidable
- Token refresh handled automatically by Supabase SDK

**Authorization:**
- All API endpoints validate JWT token
- User ID extracted from token (never from request body)
- Row-Level Security (RLS) in database as second layer of defense

**XSS Prevention:**
- React escapes JSX content by default
- Avoid `dangerouslySetInnerHTML`
- Sanitize any user-generated content if displayed as HTML

**CSRF Protection:**
- Supabase Auth provides CSRF protection
- SameSite cookie attribute

**Input Validation:**
- Client-side validation for UX
- Server-side validation is source of truth (never trust client)
- Character limits enforced on both sides

**HTTPS Only:**
- All production traffic over HTTPS
- Secure flag on cookies

**Rate Limiting:**
- API enforces rate limits (10 generations/hour)
- UI displays appropriate error messages
- No way to bypass client-side

---

### Component Architecture

**File Structure:**
```
src/
├── components/
│   ├── ui/                          # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── toast.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   └── progress.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx              # Navigation sidebar
│   │   └── Layout.astro             # Main layout wrapper
│   ├── auth/
│   │   └── AuthForm.tsx             # Login/Register form
│   ├── generation/
│   │   ├── TextInput.tsx            # Textarea with validation
│   │   ├── ProposalsList.tsx        # Table of proposals
│   │   └── ProposalRow.tsx          # Single proposal with edit
│   ├── flashcards/
│   │   ├── FlashcardsList.tsx       # Main flashcards view
│   │   ├── FlashcardsTable.tsx      # Table component
│   │   ├── FlashcardModal.tsx       # Create/Edit modal
│   │   ├── DeleteConfirmDialog.tsx  # Delete confirmation
│   │   └── FlashcardFilters.tsx     # Sort/filter controls
│   ├── learning/
│   │   ├── StudySession.tsx         # Full study session view
│   │   └── FlashcardDisplay.tsx     # Single card display
│   └── history/
│       ├── GenerationsHistory.tsx   # Main history view
│       ├── GenerationsTable.tsx     # Table component
│       └── StatsSummary.tsx         # Summary cards
├── pages/
│   ├── index.astro                  # Landing/Auth page
│   ├── generate.astro               # Generate flashcards page
│   ├── flashcards.astro             # My flashcards page
│   ├── study.astro                  # Study session page
│   ├── history.astro                # Generation history page
│   ├── profile.astro                # Profile page
│   └── api/                         # API routes (already defined)
├── lib/
│   ├── supabaseClient.ts            # Supabase client setup
│   ├── api.ts                       # API helper functions
│   └── utils.ts                     # Utility functions
└── types.ts                         # Shared TypeScript types
```

**Component Responsibilities:**

**Layout Components:**
- `Sidebar.tsx`: Navigation menu, active state, mobile toggle
- `Layout.astro`: Wraps pages, includes sidebar, provides auth context

**Page-Level Components:**
- Each page in `/pages` corresponds to a view
- Pages are Astro files that can include React components
- Handle routing and initial data loading

**Feature Components:**
- Self-contained, handle their own state and API calls
- Example: `FlashcardsList.tsx` fetches flashcards, manages filters/pagination
- Compose smaller components (Table, Filters, Modal)

**UI Components (Shadcn/ui):**
- Imported from `/components/ui`
- Minimal customization, use Tailwind classes for styling
- Reused across features

---

### Key Shadcn/ui Components Used

**Form & Input:**
- `Button` - All clickable actions
- `Input` - Email, password fields
- `Textarea` - Flashcard content, source text
- `Checkbox` - Proposal selection
- `Select` - Dropdowns for sorting/filtering

**Layout & Structure:**
- `Card` - Flashcard display, summary stats
- `Table` - Flashcards list, proposals, history

**Overlays:**
- `Dialog` - Create/Edit flashcard modal
- `AlertDialog` - Delete confirmation, critical errors
- `Toast` - Success messages, non-critical errors

**Feedback:**
- `Progress` - Study session progress bar
- `Spinner` - Loading states (may need custom or lucide-react icon)

**Installation:**
```bash
npx shadcn-ui@latest add button input textarea card table dialog alert-dialog toast checkbox select progress
```

---

### API Endpoint Usage by View

| View | API Endpoints Used |
|------|-------------------|
| **Auth** | Supabase Auth SDK: `signUp()`, `signIn()`, `signOut()` |
| **Generate Flashcards** | `POST /api/generations`<br>`POST /api/flashcards/batch` |
| **My Flashcards** | `GET /api/flashcards` (with query params)<br>`POST /api/flashcards`<br>`PATCH /api/flashcards/{id}`<br>`DELETE /api/flashcards/{id}` |
| **Study Session** | `GET /api/flashcards` (fetch all user cards)<br>Local algorithm for scheduling |
| **Generation History** | `GET /api/generations` (with query params) |
| **Profile** | Supabase Auth SDK: `getUser()`, `signOut()` |

---

### Data Flow Examples

**Example 1: Generate and Save Flashcards**

```
User Action: Paste text → Click "Generate"
  ↓
Client Validation: Check 1000-10000 chars
  ↓
POST /api/generations with source_text
  ↓
API: Create generation record, call LLM, return proposals
  ↓
Client: Store proposals in local state, display in table
  ↓
User Action: Select proposals, edit some, click "Save Selected"
  ↓
POST /api/flashcards/batch with generation_id and flashcards array
  ↓
API: Create flashcards, update generation statistics
  ↓
Client: Show success toast, clear proposals, navigate to "My Flashcards"
```

**Example 2: Edit Existing Flashcard**

```
User: Navigate to "My Flashcards"
  ↓
Client: GET /api/flashcards?page=1&limit=20
  ↓
API: Return paginated flashcards
  ↓
Client: Display in table
  ↓
User: Click "Edit" on a flashcard
  ↓
Client: Open modal, populate with current values
  ↓
User: Modify text, click "Save"
  ↓
Client Validation: Check character limits
  ↓
PATCH /api/flashcards/{id} with new front/back
  ↓
API: Update flashcard, change source if needed (ai-full → ai-edited)
  ↓
Client: Close modal, refetch flashcards, show success toast
```

**Example 3: Study Session**

```
User: Navigate to "Study Session"
  ↓
Client: GET /api/flashcards (fetch all user's flashcards)
  ↓
Client: Initialize spaced repetition algorithm with cards
  ↓
Algorithm: Determine first card to show
  ↓
Client: Display front of card
  ↓
User: Click "Show Answer"
  ↓
Client: Display back of card + assessment buttons
  ↓
User: Click "Medium"
  ↓
Algorithm: Update card's next review date/ease factor
  ↓
Algorithm: Determine next card
  ↓
Client: Display next card OR show "Session complete" if done
  ↓
Client: Save algorithm state to localStorage
```

---

### Performance Considerations

**Initial Load:**
- Astro generates static HTML where possible
- React components hydrate on interaction (Astro islands)
- Minimize JavaScript bundle size

**Data Fetching:**
- Fetch only what's needed for current view
- Paginate lists (20 items/page)
- No prefetching in MVP (can add later)

**Images:**
- Minimal images in MVP (logo, icons)
- Use SVG for icons (lucide-react)
- Optimize any raster images

**Code Splitting:**
- Astro handles this automatically per page
- React components lazy-loaded where beneficial

**API Response Times:**
- Generation endpoint may take 3-5 seconds (LLM call)
- Show loading spinner during wait
- Other endpoints should be fast (< 500ms)

**Caching:**
- Browser caches static assets automatically
- No client-side data caching in MVP (refetch on mount)
- Consider HTTP caching headers for API responses

---

### Testing Strategy (Future)

**Not required for MVP, but plan for:**

**Unit Tests:**
- Utility functions
- Form validation logic
- API helper functions

**Component Tests:**
- Render tests for UI components
- Interaction tests (click, type, submit)
- Use React Testing Library

**Integration Tests:**
- Full user flows (generate → save → study)
- Mock API responses
- Use Playwright or Cypress

**E2E Tests:**
- Critical paths: auth, generate, study
- Run against staging environment

---

### Deployment Considerations

**Build Process:**
```bash
npm run build  # Astro builds static site + API routes
```

**Environment Variables:**
```env
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENROUTER_API_KEY=xxx
```

**Hosting Options:**
- Vercel (recommended for Astro + SSR)
- Netlify
- DigitalOcean App Platform (per tech-stack.md)

**Build Output:**
- Astro generates hybrid output (static + SSR)
- API routes run as serverless functions
- Static assets served from CDN

**CI/CD:**
- GitHub Actions (per tech-stack.md)
- Run linter, type-check on PR
- Auto-deploy to staging on merge to develop
- Manual deploy to production

---

## Unresolved Issues

### None - All Major Decisions Made

The user has provided clear direction on all key architectural decisions:
- Navigation: Sidebar
- Complexity: Maximum simplicity throughout
- Error handling: Modals for critical, toasts for non-critical
- State management: Local state only
- Features: Basic functionality only

### Minor Items to Decide During Implementation

These can be decided by the developer during implementation without further consultation:

1. **Exact color scheme** - Use Tailwind default colors or pick a brand palette (blue/purple/etc.)

2. **Sidebar width** - 240px vs 256px vs 280px (standard options)

3. **Spaced repetition library** - Choose between `ts-fsrs`, `supermemo`, or similar open-source implementation

4. **Toast position** - Top-right vs bottom-right vs top-center (Shadcn/ui supports all)

5. **Animation preferences** - Use Tailwind transitions vs Framer Motion vs none (keep simple for MVP)

6. **Error boundary implementation** - Whether to add React Error Boundaries for graceful error handling

7. **Analytics integration** - Defer to post-MVP unless specifically requested

8. **Logo and branding** - Text-based logo acceptable for MVP, or simple icon

---

## Next Steps

### Immediate Actions

1. **Initialize Shadcn/ui** in the project
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button input textarea card table dialog alert-dialog toast checkbox select progress
   ```

2. **Create file structure** as outlined in Component Architecture section

3. **Implement Layout & Navigation**
   - Create `Sidebar.tsx` component
   - Create main `Layout.astro` wrapper
   - Set up routing in Astro pages

4. **Implement Auth Flow**
   - Set up Supabase client
   - Create auth forms
   - Implement protected routes

5. **Implement Core Features in Priority Order:**
   - Priority 1: Auth (login/register)
   - Priority 2: Generate flashcards + save proposals
   - Priority 3: My flashcards (list, create, edit, delete)
   - Priority 4: Study session
   - Priority 5: Generation history
   - Priority 6: Profile (minimal)

6. **Testing**
   - Manual testing of each flow
   - Test on mobile and desktop
   - Test error scenarios

7. **Polish**
   - Consistent spacing and sizing
   - Loading states everywhere needed
   - Proper error messages
   - Accessibility review

---

## Conclusion

This UI architecture plan provides a clear, implementation-ready blueprint for the 10x-Cards MVP. The focus on simplicity ensures rapid development while maintaining a solid foundation for future enhancements. All major architectural decisions have been made, and the component structure, data flows, and API integration strategies are well-defined.

The architecture leverages modern tools (Astro, React, Shadcn/ui) effectively while avoiding unnecessary complexity. The result will be a functional, user-friendly flashcard application that meets all MVP requirements outlined in the PRD.

---

**Document Version:** 1.0  
**Date:** 2026-01-31  
**Status:** Ready for Implementation
