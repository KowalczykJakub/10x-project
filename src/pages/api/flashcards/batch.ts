import type { APIRoute } from "astro";
import type {
  BatchCreateFlashcardsDTO,
  BatchCreateFlashcardsResponseDTO,
  FlashcardDTO,
  ErrorResponseDTO,
} from "@/types";
import { mockFlashcards } from "./index";
import { mockGenerations } from "../generations/index";

export const prerender = false;

/**
 * POST /api/flashcards/batch
 * Create multiple flashcards from AI generation
 *
 * MOCK VERSION: Returns success without database integration
 * TODO: Add database integration when ready
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;

  // Check authentication
  if (!user) {
    const errorResponse: ErrorResponseDTO = {
      error: "Unauthorized",
      message: "Musisz być zalogowany",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse request body
  let body: BatchCreateFlashcardsDTO;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Invalid JSON in request body",
      } as ErrorResponseDTO),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Basic validation
  if (!body.generation_id || !body.flashcards || !Array.isArray(body.flashcards)) {
    return new Response(
      JSON.stringify({
        error: "Validation Error",
        message: "Missing required fields: generation_id and flashcards array",
      } as ErrorResponseDTO),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (body.flashcards.length === 0) {
    return new Response(
      JSON.stringify({
        error: "Validation Error",
        message: "At least one flashcard is required",
      } as ErrorResponseDTO),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate each flashcard
  for (let i = 0; i < body.flashcards.length; i++) {
    const card = body.flashcards[i];

    if (!card.front || !card.back) {
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: `Flashcard at index ${i} is missing front or back`,
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (card.front.length > 200) {
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: `Flashcard at index ${i}: front text exceeds 200 characters`,
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (card.back.length > 500) {
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: `Flashcard at index ${i}: back text exceeds 500 characters`,
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  try {
    // MOCK: Simulate database save
    // In real implementation, this would:
    // 1. Get user_id from auth session
    // 2. Save flashcards to database
    // 3. Update generation statistics

    const now = new Date().toISOString();
    const newFlashcards: FlashcardDTO[] = body.flashcards.map((card, index) => ({
      id: Date.now() + index, // Mock ID
      front: card.front,
      back: card.back,
      source: card.edited ? "ai-edited" : "ai-full",
      generation_id: body.generation_id,
      created_at: now,
      updated_at: now,
    }));

    // Add to mock store
    mockFlashcards.push(...newFlashcards);

    // Update generation statistics
    const generation = mockGenerations.find((g) => g.id === body.generation_id);
    if (generation) {
      const editedCount = body.flashcards.filter((c) => c.edited).length;
      const uneditedCount = body.flashcards.length - editedCount;

      generation.accepted_edited_count = editedCount;
      generation.accepted_unedited_count = uneditedCount;
    }

    const response: BatchCreateFlashcardsResponseDTO = {
      created_count: newFlashcards.length,
      flashcards: newFlashcards,
    };

    // Flashcards created successfully

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Batch create error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to create flashcards",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
