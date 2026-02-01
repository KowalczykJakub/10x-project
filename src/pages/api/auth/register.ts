import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';
import { registerSchema } from '../../../lib/schemas/auth.schema.ts';
import { getAuthErrorMessage } from '../../../lib/utils/auth-errors.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod
    const validationResult = registerSchema.safeParse(body);
    
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

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email confirmation będzie opcjonalna (wybór 2B)
        // Użytkownik może się zalogować od razu, ale dostanie prośbę o weryfikację
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    });

    if (error) {
      const errorMessage = getAuthErrorMessage(error);
      return new Response(
        JSON.stringify({
          error: 'Registration Error',
          message: errorMessage,
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if email confirmation is required
    const requiresConfirmation = data.user && !data.session;

    return new Response(
      JSON.stringify({
        message: requiresConfirmation 
          ? 'Konto zostało utworzone! Sprawdź swoją skrzynkę email, aby zweryfikować adres.'
          : 'Konto zostało utworzone pomyślnie!',
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        requiresConfirmation,
      }),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
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
