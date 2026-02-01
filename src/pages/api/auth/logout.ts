import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const prerender = false;

export const POST: APIRoute = async ({ locals, cookies, request }) => {
  const { session } = locals;

  // Check if user is logged in
  if (!session) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Brak sesji użytkownika',
      }),
      { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Create Supabase client
    const supabase = createSupabaseServerInstance({ 
      cookies, 
      headers: request.headers 
    });

    // Sign out - this will clear the session cookies
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Wylogowano pomyślnie' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Nie udało się wylogować',
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
