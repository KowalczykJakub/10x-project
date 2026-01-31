import type { APIRoute } from 'astro';
import type { 
  FlashcardDTO,
  UpdateFlashcardDTO,
  DeleteFlashcardResponseDTO,
  ErrorResponseDTO 
} from '@/types';
import { mockFlashcards } from './index';

export const prerender = false;

/**
 * PATCH /api/flashcards/[id]
 * Update an existing flashcard
 * 
 * MOCK VERSION: Updates in-memory store
 * TODO: Add database integration when ready
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  const id = parseInt(params.id || '0');
  
  if (!id) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid flashcard ID'
      } as ErrorResponseDTO),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  let body: UpdateFlashcardDTO;
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
  if (body.front !== undefined && (body.front.length === 0 || body.front.length > 200)) {
    return new Response(
      JSON.stringify({
        error: 'Validation Error',
        message: 'Front must be 1-200 characters'
      } as ErrorResponseDTO),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  if (body.back !== undefined && (body.back.length === 0 || body.back.length > 500)) {
    return new Response(
      JSON.stringify({
        error: 'Validation Error',
        message: 'Back must be 1-500 characters'
      } as ErrorResponseDTO),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const flashcardIndex = mockFlashcards.findIndex(f => f.id === id);
    
    if (flashcardIndex === -1) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'Flashcard not found'
        } as ErrorResponseDTO),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const flashcard = mockFlashcards[flashcardIndex];
    
    // Update fields
    if (body.front !== undefined) {
      flashcard.front = body.front.trim();
    }
    if (body.back !== undefined) {
      flashcard.back = body.back.trim();
    }
    flashcard.updated_at = new Date().toISOString();

    mockFlashcards[flashcardIndex] = flashcard;

    return new Response(
      JSON.stringify(flashcard),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error) {
    console.error('Update flashcard error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to update flashcard',
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
 * DELETE /api/flashcards/[id]
 * Delete a flashcard
 * 
 * MOCK VERSION: Removes from in-memory store
 * TODO: Add database integration when ready
 */
export const DELETE: APIRoute = async ({ params }) => {
  const id = parseInt(params.id || '0');
  
  if (!id) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid flashcard ID'
      } as ErrorResponseDTO),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const flashcardIndex = mockFlashcards.findIndex(f => f.id === id);
    
    if (flashcardIndex === -1) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'Flashcard not found'
        } as ErrorResponseDTO),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    mockFlashcards.splice(flashcardIndex, 1);

    const response: DeleteFlashcardResponseDTO = {
      message: 'Flashcard deleted successfully',
      id,
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
    console.error('Delete flashcard error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to delete flashcard',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as ErrorResponseDTO),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
