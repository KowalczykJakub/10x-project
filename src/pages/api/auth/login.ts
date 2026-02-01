import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';
import { loginSchema } from '../../../lib/schemas/auth.schema.ts';
import { getAuthErrorMessage } from '../../../lib/utils/auth-errors.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          message: 'Nieprawidłowe dane wejściowe',
          details: validationResult.error.flatten().fieldErrors,
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const { email, password } = validationResult.data;

    // Create Supabase client
    const supabase = createSupabaseServerInstance({ 
      cookies, 
      headers: request.headers 
    });

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const errorMessage = getAuthErrorMessage(error);
      return new Response(
        JSON.stringify({
          error: 'Authentication Error',
          message: errorMessage,
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Success - session cookies are automatically set by Supabase
    return new Response(
      JSON.stringify({
        message: 'Zalogowano pomyślnie',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Wystąpił błąd serwera. Spróbuj ponownie.',
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
