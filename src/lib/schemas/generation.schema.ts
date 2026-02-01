import { z } from "zod";

/**
 * Validation schema for creating a generation
 * Ensures source_text is between 1000-10000 characters and not empty/whitespace-only
 */
export const CreateGenerationSchema = z.object({
  source_text: z
    .string()
    .trim()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters")
    .refine((text) => text.replace(/\s/g, "").length > 0, "Source text cannot be empty or contain only whitespace"),
});

/**
 * Type inference from the validation schema
 */
export type CreateGenerationInput = z.infer<typeof CreateGenerationSchema>;

/**
 * Validation schema for individual flashcard proposals from LLM
 * Used to validate LLM response structure
 */
export const FlashcardProposalSchema = z.object({
  front: z.string().min(1, "Front text cannot be empty").max(200, "Front text must not exceed 200 characters"),
  back: z.string().min(1, "Back text cannot be empty").max(500, "Back text must not exceed 500 characters"),
});

/**
 * Validation schema for array of flashcard proposals from LLM
 * Wrapped in an object for structured JSON response
 */
export const FlashcardProposalsSchema = z.object({
  proposals: z
    .array(FlashcardProposalSchema)
    .min(1, "At least one flashcard proposal is required")
    .max(10, "Maximum 10 flashcard proposals allowed"),
});

/**
 * Type inference from the validation schema
 */
export type FlashcardProposalsType = z.infer<typeof FlashcardProposalsSchema>;
export type FlashcardProposalType = z.infer<typeof FlashcardProposalSchema>;
