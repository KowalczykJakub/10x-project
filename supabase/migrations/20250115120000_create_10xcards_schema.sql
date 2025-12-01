-- ============================================================================
-- Migration: Create 10xCards Database Schema
-- ============================================================================
-- Purpose: 
--   Creates the complete database schema for the 10xCards application,
--   including tables for flashcards, generations, and error logs.
--
-- Affected Tables:
--   - generations (new)
--   - flashcards (new)
--   - generation_error_logs (new)
--
-- Special Considerations:
--   - References auth.users table (managed by Supabase Auth)
--   - Implements Row Level Security (RLS) for all tables
--   - Creates indexes for performance optimization
--   - Adds trigger for automatic updated_at timestamp updates
-- ============================================================================

-- ============================================================================
-- 1. Create generations table
-- ============================================================================
-- This table stores metadata about AI generation sessions where flashcards
-- were created from source text. It tracks generation statistics and
-- performance metrics.

create table if not exists generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count integer not null,
  accepted_unedited_count integer,
  accepted_edited_count integer,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  generation_duration integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. Create flashcards table
-- ============================================================================
-- This table stores individual flashcards with front and back content.
-- Each flashcard can optionally be linked to a generation session.
-- The source field indicates how the flashcard was created.

create table if not exists flashcards (
  id bigserial primary key,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generation_id bigint references generations(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade
);

-- ============================================================================
-- 3. Create generation_error_logs table
-- ============================================================================
-- This table logs errors that occur during flashcard generation attempts.
-- It helps track failures and debug issues with the AI generation process.

create table if not exists generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 4. Create indexes for performance optimization
-- ============================================================================
-- These indexes improve query performance for common access patterns,
-- particularly when filtering by user_id or generation_id.

-- Index on flashcards.user_id for fast user-specific queries
create index if not exists idx_flashcards_user_id on flashcards(user_id);

-- Index on flashcards.generation_id for fast generation-linked queries
create index if not exists idx_flashcards_generation_id on flashcards(generation_id);

-- Index on generations.user_id for fast user-specific generation queries
create index if not exists idx_generations_user_id on generations(user_id);

-- Index on generation_error_logs.user_id for fast user-specific error queries
create index if not exists idx_generation_error_logs_user_id on generation_error_logs(user_id);

-- ============================================================================
-- 5. Enable Row Level Security (RLS) on all tables
-- ============================================================================
-- RLS ensures that users can only access their own data, providing
-- a security layer at the database level.

alter table flashcards enable row level security;
alter table generations enable row level security;
alter table generation_error_logs enable row level security;

-- ============================================================================
-- 6. Create RLS Policies for flashcards table
-- ============================================================================
-- Policies ensure authenticated users can only access their own flashcards.

-- Policy: Allow authenticated users to select their own flashcards
create policy "authenticated_users_can_select_own_flashcards"
  on flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert their own flashcards
create policy "authenticated_users_can_insert_own_flashcards"
  on flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own flashcards
create policy "authenticated_users_can_update_own_flashcards"
  on flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to delete their own flashcards
create policy "authenticated_users_can_delete_own_flashcards"
  on flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- 7. Create RLS Policies for generations table
-- ============================================================================
-- Policies ensure authenticated users can only access their own generation records.

-- Policy: Allow authenticated users to select their own generations
create policy "authenticated_users_can_select_own_generations"
  on generations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert their own generations
create policy "authenticated_users_can_insert_own_generations"
  on generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own generations
create policy "authenticated_users_can_update_own_generations"
  on generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to delete their own generations
create policy "authenticated_users_can_delete_own_generations"
  on generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- 8. Create RLS Policies for generation_error_logs table
-- ============================================================================
-- Policies ensure authenticated users can only access their own error logs.

-- Policy: Allow authenticated users to select their own error logs
create policy "authenticated_users_can_select_own_error_logs"
  on generation_error_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert their own error logs
create policy "authenticated_users_can_insert_own_error_logs"
  on generation_error_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Note: Error logs are typically append-only, so update and delete policies
-- are intentionally omitted. If needed in the future, they can be added here.

-- ============================================================================
-- 9. Create trigger function for updating updated_at timestamp
-- ============================================================================
-- This function automatically updates the updated_at column whenever
-- a record in the flashcards table is modified.

create or replace function update_flashcards_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 10. Create trigger on flashcards table
-- ============================================================================
-- This trigger calls the update function before each update operation,
-- ensuring the updated_at timestamp is always current.

create trigger trigger_update_flashcards_updated_at
  before update on flashcards
  for each row
  execute function update_flashcards_updated_at();

