import type { APIRoute } from 'astro';
import type { 
  FlashcardDTO,
  FlashcardListResponseDTO,
  CreateFlashcardDTO,
  ErrorResponseDTO 
} from '@/types';

export const prerender = false;

// Mock flashcards store (in-memory for development)
// In production, this would be replaced with database queries
let mockFlashcards: FlashcardDTO[] = [];

/**
 * GET /api/flashcards
 * List flashcards with pagination, sorting, and filtering
 * 
 * MOCK VERSION: Returns empty list initially
 * TODO: Add database integration when ready
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const { user } = locals;

  // Check authentication
  if (!user) {
    const errorResponse: ErrorResponseDTO = {
      error: 'Unauthorized',
      message: 'Musisz być zalogowany',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const searchParams = url.searchParams;
  
  // Parse query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';
  const source = searchParams.get('source');
  const search = searchParams.get('search');

  try {
    // TODO: Filter by user.id when database is integrated
    // const { data, error } = await supabase
    //   .from('flashcards')
    //   .select('*')
    //   .eq('user_id', user.id);
    // MOCK: Filter flashcards
    let filtered = [...mockFlashcards];

    // Filter by source
    if (source && source !== 'all') {
      filtered = filtered.filter(f => f.source === source);
    }

    // Search in front/back
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(f => 
        f.front.toLowerCase().includes(searchLower) ||
        f.back.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (sort === 'front') {
        aVal = a.front.toLowerCase();
        bVal = b.front.toLowerCase();
      } else {
        aVal = new Date(a[sort as keyof FlashcardDTO] as string).getTime();
        bVal = new Date(b[sort as keyof FlashcardDTO] as string).getTime();
      }

      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Paginate
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedFlashcards = filtered.slice(offset, offset + limit);

    const response: FlashcardListResponseDTO = {
      data: paginatedFlashcards,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
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
    console.error('List flashcards error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to retrieve flashcards',
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
 * POST /api/flashcards
 * Create a single flashcard manually
 * 
 * MOCK VERSION: Stores in memory
 * TODO: Add database integration when ready
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;

  // Check authentication
  if (!user) {
    const errorResponse: ErrorResponseDTO = {
      error: 'Unauthorized',
      message: 'Musisz być zalogowany',
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: CreateFlashcardDTO;
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

  // Validate
  if (!body.front || !body.back) {
    return new Response(
      JSON.stringify({
        error: 'Validation Error',
        message: 'Both front and back fields are required'
      } as ErrorResponseDTO),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  if (body.front.length > 200 || body.back.length > 500) {
    return new Response(
      JSON.stringify({
        error: 'Validation Error',
        message: 'Front must be ≤200 chars, back must be ≤500 chars'
      } as ErrorResponseDTO),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const now = new Date().toISOString();
    const newFlashcard: FlashcardDTO = {
      id: Date.now(),
      front: body.front.trim(),
      back: body.back.trim(),
      source: 'manual',
      generation_id: null,
      created_at: now,
      updated_at: now,
    };

    mockFlashcards.push(newFlashcard);

    return new Response(
      JSON.stringify(newFlashcard),
      {
        status: 201,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error) {
    console.error('Create flashcard error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to create flashcard',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ErrorResponseDTO),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

// Export mockFlashcards for use in [id].ts
export { mockFlashcards };
