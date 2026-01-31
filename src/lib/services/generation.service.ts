import type { 
  GenerationDTO, 
  FlashcardProposalDTO,
  CreateGenerationResponseDTO,
  GenerationErrorLogInsertDTO
} from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import { OpenRouterService } from './openrouter.service';
import { OpenRouterErrorFactory } from '../errors/openrouter.errors';
import { sha256Hash } from '../utils/crypto';

/**
 * Service for orchestrating flashcard generation workflow
 * Coordinates between OpenRouter API and database operations
 */
export class GenerationService {
  private openRouterService: OpenRouterService;
  private supabase?: SupabaseClient<Database>;

  /**
   * Create a new GenerationService
   * 
   * @param apiKey - OpenRouter API key
   * @param supabase - Optional Supabase client for database operations
   */
  constructor(apiKey: string, supabase?: SupabaseClient<Database>) {
    this.openRouterService = new OpenRouterService(apiKey, {
      defaultModel: 'anthropic/claude-3.5-sonnet',
      timeout: 30000,
      retryAttempts: 2,
    });
    this.supabase = supabase;
  }

  /**
   * Generate flashcards from source text
   * 
   * @param sourceText - The text to generate flashcards from
   * @param userId - Optional user ID (required for database persistence)
   * @param model - The LLM model to use
   * @returns Generation metadata and flashcard proposals
   * @throws Error if generation fails
   */
  async generateFlashcards(
    sourceText: string,
    userId?: string,
    model: string = 'anthropic/claude-3.5-sonnet'
  ): Promise<CreateGenerationResponseDTO> {
    const startTime = performance.now();
    
    // Hash source text for tracking and deduplication
    const sourceTextHash = await sha256Hash(sourceText);
    
    try {
      // Generate flashcards using OpenRouter
      const proposals = await this.openRouterService.generateFlashcards(
        sourceText,
        model
      );
      
      // Calculate duration
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      // Create generation record in database (if supabase client and userId provided)
      let generation: GenerationDTO;
      
      if (this.supabase && userId) {
        const { data, error } = await this.supabase
          .from('generations')
          .insert({
            user_id: userId,
            model: model,
            generated_count: proposals.length,
            accepted_unedited_count: 0,
            accepted_edited_count: 0,
            source_text_hash: sourceTextHash,
            source_text_length: sourceText.length,
            generation_duration: duration,
          })
          .select()
          .single();
        
        if (error) {
          console.error('Failed to create generation record:', error);
          throw new Error(`Failed to create generation record: ${error.message}`);
        }
        
        generation = {
          id: data.id,
          model: data.model,
          generated_count: data.generated_count,
          accepted_unedited_count: data.accepted_unedited_count,
          accepted_edited_count: data.accepted_edited_count,
          source_text_length: data.source_text_length,
          generation_duration: data.generation_duration,
          created_at: data.created_at,
        };
      } else {
        // Mock generation for development (no database)
        generation = {
          id: Math.floor(Math.random() * 10000),
          model: model,
          generated_count: proposals.length,
          accepted_unedited_count: 0,
          accepted_edited_count: 0,
          source_text_length: sourceText.length,
          generation_duration: duration,
          created_at: new Date().toISOString(),
        };
      }
      
      return {
        generation,
        proposals,
      };
      
    } catch (error) {
      // Log error to database if available
      if (this.supabase && userId) {
        await this.logGenerationError(
          userId,
          model,
          sourceTextHash,
          sourceText.length,
          error
        ).catch(logError => {
          // Don't throw if logging fails, just log to console
          console.error('Failed to log generation error:', logError);
        });
      }
      
      // Re-throw the original error
      throw error;
    }
  }

  /**
   * Log generation error to database
   * 
   * @param userId - User ID
   * @param model - Model name
   * @param sourceTextHash - Hash of source text
   * @param sourceTextLength - Length of source text
   * @param error - The error that occurred
   */
  private async logGenerationError(
    userId: string,
    model: string,
    sourceTextHash: string,
    sourceTextLength: number,
    error: unknown
  ): Promise<void> {
    if (!this.supabase) return;
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = OpenRouterErrorFactory.isOpenRouterError(error) 
      ? error.code 
      : 'UNKNOWN_ERROR';
    
    const errorLog: GenerationErrorLogInsertDTO = {
      user_id: userId,
      model: model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: errorCode,
      error_message: errorMessage,
    };
    
    const { error: insertError } = await this.supabase
      .from('generation_error_logs')
      .insert(errorLog);
    
    if (insertError) {
      console.error('Failed to insert error log:', insertError);
    }
  }
}
