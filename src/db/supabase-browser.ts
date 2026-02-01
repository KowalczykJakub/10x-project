import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types.ts';

/**
 * Creates a Supabase Browser Client for React components
 * Uses @supabase/ssr for proper cookie management on the client side
 */
export const createSupabaseBrowserClient = () => {
  return createBrowserClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY
  );
};

// Singleton instance for React components
export const supabaseBrowser = createSupabaseBrowserClient();
