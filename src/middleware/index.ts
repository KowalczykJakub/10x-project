import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

// MOCK: Tymczasowy middleware bez prawdziwej konfiguracji Supabase
// TODO: Przywrócić prawdziwą konfigurację gdy będzie gotowa integracja z Supabase
export const onRequest = defineMiddleware((context, next) => {
  // Tworzymy mock klienta Supabase z dummy wartościami
  const mockSupabaseUrl = import.meta.env.SUPABASE_URL || "https://mock.supabase.co";
  const mockSupabaseKey = import.meta.env.SUPABASE_KEY || "mock-key";

  context.locals.supabase = createClient<Database>(mockSupabaseUrl, mockSupabaseKey);
  return next();
});
