-- ============================================================================
-- Migration: Disable RLS Policies for 10xCards Tables
-- ============================================================================
-- Purpose: 
--   Drops all Row Level Security (RLS) policies from flashcards, generations,
--   and generation_error_logs tables that were created in the initial schema
--   migration.
--
-- Affected Tables:
--   - flashcards (policies removed)
--   - generations (policies removed)
--   - generation_error_logs (policies removed)
--
-- Special Considerations:
--   - This is a DESTRUCTIVE operation that removes security policies
--   - RLS remains enabled on tables, but without policies, access will be
--     denied by default unless new policies are added
--   - Use with caution in production environments
-- ============================================================================

-- ============================================================================
-- 1. Drop RLS Policies for flashcards table
-- ============================================================================
-- DESTRUCTIVE: Removes all security policies from the flashcards table.
-- After this migration, no users will be able to access flashcards unless
-- new policies are created.

drop policy if exists "authenticated_users_can_select_own_flashcards" on flashcards;
drop policy if exists "authenticated_users_can_insert_own_flashcards" on flashcards;
drop policy if exists "authenticated_users_can_update_own_flashcards" on flashcards;
drop policy if exists "authenticated_users_can_delete_own_flashcards" on flashcards;

-- ============================================================================
-- 2. Drop RLS Policies for generations table
-- ============================================================================
-- DESTRUCTIVE: Removes all security policies from the generations table.
-- After this migration, no users will be able to access generations unless
-- new policies are created.

drop policy if exists "authenticated_users_can_select_own_generations" on generations;
drop policy if exists "authenticated_users_can_insert_own_generations" on generations;
drop policy if exists "authenticated_users_can_update_own_generations" on generations;
drop policy if exists "authenticated_users_can_delete_own_generations" on generations;

-- ============================================================================
-- 3. Drop RLS Policies for generation_error_logs table
-- ============================================================================
-- DESTRUCTIVE: Removes all security policies from the generation_error_logs table.
-- After this migration, no users will be able to access error logs unless
-- new policies are created.

drop policy if exists "authenticated_users_can_select_own_error_logs" on generation_error_logs;
drop policy if exists "authenticated_users_can_insert_own_error_logs" on generation_error_logs;

