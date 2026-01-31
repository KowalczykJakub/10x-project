import type { APIRoute } from 'astro';
import { CreateGenerationSchema } from '@/lib/schemas/generation.schema';
import { GenerationService } from '@/lib/services/generation.service';
import { OpenRouterErrorFactory } from '@/lib/errors/openrouter.errors';
import type { 
  CreateGenerationResponseDTO, 
  GenerationListResponseDTO,
  GenerationDTO,
  ErrorResponseDTO 
} from '@/types';

export const prerender = false;

// Mock generations store (in-memory for development)
let mockGenerations: GenerationDTO[] = [];

/**
 * GET /api/generations
 * List generation history with statistics
 * 
 * MOCK VERSION: Returns stored generations
 * TODO: Replace with database queries when authentication is implemented
 */
export const GET: APIRoute = async ({ url }) => {
  const searchParams = url.searchParams;
  
  // Parse query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';

  try {
    // Sort
    const sorted = [...mockGenerations].sort((a, b) => {
      const aVal = new Date(a[sort as keyof GenerationDTO] as string).getTime();
      const bVal = new Date(b[sort as keyof GenerationDTO] as string).getTime();

      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Paginate
    const total = sorted.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedGenerations = sorted.slice(offset, offset + limit);

    // Calculate statistics
    const totalGenerated = mockGenerations.reduce((sum, g) => sum + g.generated_count, 0);
    const totalAccepted = mockGenerations.reduce(
      (sum, g) => sum + g.accepted_unedited_count + g.accepted_edited_count, 
      0
    );
    const acceptanceRate = totalGenerated > 0 ? totalAccepted / totalGenerated : 0;

    const response: GenerationListResponseDTO = {
      data: paginatedGenerations,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
      statistics: {
        total_generations: mockGenerations.length,
        total_flashcards_generated: totalGenerated,
        total_flashcards_accepted: totalAccepted,
        acceptance_rate: acceptanceRate,
      },
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error) {
    console.error('List generations error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to retrieve generations',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ErrorResponseDTO),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

/**
 * POST /api/generations
 * Generate flashcard proposals from source text
 * 
 * Real implementation with OpenRouter API integration
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid JSON in request body'
      } as ErrorResponseDTO),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  // Validate request body
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
          max_length: 10000,
          errors: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }
      } as ErrorResponseDTO),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  // Get OpenRouter API key from environment
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY environment variable is not set');
    return new Response(
      JSON.stringify({
        error: 'Server Configuration Error',
        message: 'API service is not properly configured'
      } as ErrorResponseDTO),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  // Get user ID from locals (if authentication middleware is available)
  const userId = locals.userId; // Assume middleware sets this (optional for now)

  // Get model from request or use default
  const model = body.model || 'anthropic/claude-3.5-sonnet';

  // Generate flashcards
  try {
    // Create service instance
    const generationService = new GenerationService(
      apiKey,
      locals.supabase // Pass supabase client if available
    );

    // Generate flashcards
    const result = await generationService.generateFlashcards(
      validation.data.source_text,
      userId,
      model
    );

    // Store generation in mock store (for development without database)
    if (!locals.supabase) {
      mockGenerations.push(result.generation);
    }

    return new Response(
      JSON.stringify(result as CreateGenerationResponseDTO),
      {
        status: 201,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // CORS for development
        }
      }
    );
  } catch (error) {
    console.error('Generation error:', error);
    
    // Handle OpenRouter errors specifically
    if (OpenRouterErrorFactory.isOpenRouterError(error)) {
      const openRouterError = error;
      
      // Map error codes to HTTP status codes
      const statusMap: Record<string, number> = {
        'VALIDATION_ERROR': 400,
        'OPENROUTER_BAD_REQUEST': 400,
        'OPENROUTER_UNAUTHORIZED': 401,
        'OPENROUTER_FORBIDDEN': 403,
        'OPENROUTER_NOT_FOUND': 404,
        'OPENROUTER_RATE_LIMIT': 429,
        'OPENROUTER_SERVER_ERROR': 500,
        'OPENROUTER_BAD_GATEWAY': 502,
        'OPENROUTER_SERVICE_UNAVAILABLE': 503,
        'OPENROUTER_TIMEOUT': 504,
        'OPENROUTER_GATEWAY_TIMEOUT': 504,
      };
      
      const status = statusMap[openRouterError.code] || 500;
      
      return new Response(
        JSON.stringify({ 
          error: 'Generation Failed',
          message: openRouterError.message,
          code: openRouterError.code,
          details: openRouterError.details,
        } as ErrorResponseDTO),
        { 
          status, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Handle unknown errors
    return new Response(
      JSON.stringify({
        error: 'Generation Failed',
        message: 'An unexpected error occurred while generating flashcards',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ErrorResponseDTO),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

// Export for use in batch endpoint
export { mockGenerations };
