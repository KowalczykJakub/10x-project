import type {
  FlashcardProposalDTO,
  ChatMessage,
  ResponseFormat,
  OpenRouterServiceOptions,
  APICallOptions,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "@/types";
import { FlashcardProposalsSchema } from "../schemas/generation.schema";
import { OpenRouterErrorFactory } from "../errors/openrouter.errors";
import { RateLimiter } from "../utils/rate-limiter";

/**
 * Service for interacting with OpenRouter.ai API
 *
 * Provides methods to communicate with various LLM models through OpenRouter,
 * with built-in error handling, retry logic, and response validation.
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly httpReferer: string;
  private readonly appTitle: string;
  private readonly defaultModel: string;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;
  private readonly rateLimiter: RateLimiter;

  constructor(apiKey: string, options: OpenRouterServiceOptions = {}) {
    // Validate API key
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("OpenRouter API key is required and cannot be empty");
    }

    this.apiKey = apiKey;

    // Validate and assign baseUrl
    const baseUrl = options.baseUrl || "https://openrouter.ai/api/v1";
    if (!baseUrl.startsWith("https://")) {
      throw new Error("Base URL must use HTTPS protocol");
    }
    this.baseUrl = baseUrl;

    // Validate and assign timeout
    const timeout = options.timeout ?? 30000;
    if (timeout <= 0) {
      throw new Error("Timeout must be greater than 0");
    }
    this.timeout = timeout;

    // Validate and assign retryAttempts
    const retryAttempts = options.retryAttempts ?? 2;
    if (retryAttempts < 0) {
      throw new Error("Retry attempts cannot be negative");
    }
    this.retryAttempts = retryAttempts;

    // Assign remaining options
    this.retryDelay = options.retryDelay ?? 1000;
    this.httpReferer = options.httpReferer || "https://10xcards.app";
    this.appTitle = options.appTitle || "10xCards Flashcard Generator";
    this.defaultModel = options.defaultModel || "anthropic/claude-3.5-sonnet";

    // Initialize rate limiter: 60 requests per minute
    this.rateLimiter = new RateLimiter(60, 60000);
  }

  /**
   * Generate flashcard proposals from source text
   *
   * @param sourceText - The text to generate flashcards from
   * @param model - Optional model name (defaults to defaultModel)
   * @returns Array of flashcard proposals
   * @throws OpenRouterError if generation fails
   */
  async generateFlashcards(sourceText: string, model?: string): Promise<FlashcardProposalDTO[]> {
    // Validate input
    if (!sourceText || sourceText.trim() === "") {
      throw OpenRouterErrorFactory.create("VALIDATION_ERROR", "Source text cannot be empty");
    }

    const sanitizedText = this.sanitizeSourceText(sourceText);

    if (sanitizedText.length > 10000) {
      throw OpenRouterErrorFactory.create("VALIDATION_ERROR", "Source text exceeds maximum length of 10000 characters");
    }

    try {
      // Acquire rate limit slot
      await this.rateLimiter.acquire();

      // Build messages and response format
      const systemMessage = this.buildSystemMessage();
      const userMessage = this.buildUserMessage(sanitizedText);
      const responseFormat = this.buildResponseFormat();

      // Call API
      const response = await this.callAPI(
        model || this.defaultModel,
        [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        { responseFormat, temperature: 0.7, maxTokens: 2000 }
      );

      // Parse and return response
      return this.parseResponse(response);
    } catch (error) {
      // Propagate OpenRouter errors
      if (OpenRouterErrorFactory.isOpenRouterError(error)) {
        throw error;
      }

      // Wrap unknown errors
      throw OpenRouterErrorFactory.create(
        "OPENROUTER_UNKNOWN_ERROR",
        `Unexpected error during flashcard generation: ${error instanceof Error ? error.message : "Unknown error"}`,
        { details: error }
      );
    }
  }

  /**
   * Universal chat completion method
   *
   * @param request - Chat completion request parameters
   * @returns Chat completion response
   * @throws OpenRouterError if request fails
   */
  async chat<T = unknown>(request: ChatCompletionRequest): Promise<ChatCompletionResponse<T>> {
    // Validate
    if (!request.model) {
      throw OpenRouterErrorFactory.create("VALIDATION_ERROR", "Model name is required");
    }

    if (!request.messages || request.messages.length === 0) {
      throw OpenRouterErrorFactory.create("VALIDATION_ERROR", "At least one message is required");
    }

    try {
      await this.rateLimiter.acquire();

      const response = await this.callAPI(request.model, request.messages, {
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        responseFormat: request.responseFormat,
        topP: request.topP,
        frequencyPenalty: request.frequencyPenalty,
        presencePenalty: request.presencePenalty,
      });

      return response as ChatCompletionResponse<T>;
    } catch (error) {
      if (OpenRouterErrorFactory.isOpenRouterError(error)) {
        throw error;
      }

      throw OpenRouterErrorFactory.create(
        "OPENROUTER_UNKNOWN_ERROR",
        `Unexpected error during chat completion: ${error instanceof Error ? error.message : "Unknown error"}`,
        { details: error }
      );
    }
  }

  // ==================== Private Methods ====================

  /**
   * Build system message for flashcard generation
   */
  private buildSystemMessage(): string {
    return `You are an expert educational content creator specializing in creating effective flashcards for learning.

Your task is to analyze the provided text and generate high-quality flashcard proposals following these rules:

1. **Question Quality**:
   - Create clear, specific questions that test understanding
   - Avoid yes/no questions when possible
   - Focus on key concepts, definitions, and relationships
   - Length: 1-200 characters

2. **Answer Quality**:
   - Provide concise but complete answers
   - Include essential context when needed
   - Use clear, simple language
   - Length: 1-500 characters

3. **Quantity**:
   - Generate 3-10 flashcards depending on content richness
   - Prioritize quality over quantity
   - Avoid redundant or overlapping questions

4. **Content Coverage**:
   - Cover the most important concepts
   - Include definitions, processes, and relationships
   - Maintain factual accuracy

Return your response as a valid JSON object matching the provided schema.`;
  }

  /**
   * Build user message with source text
   */
  private buildUserMessage(sourceText: string): string {
    return `Generate flashcards from the following text:\n\n${sourceText}`;
  }

  /**
   * Build response format for structured JSON output
   */
  private buildResponseFormat(): ResponseFormat {
    return {
      type: "json_schema",
      json_schema: {
        name: "flashcard_proposals",
        strict: true,
        schema: {
          type: "object",
          properties: {
            proposals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  front: {
                    type: "string",
                    minLength: 1,
                    maxLength: 200,
                    description: "The question or prompt on the front of the flashcard",
                  },
                  back: {
                    type: "string",
                    minLength: 1,
                    maxLength: 500,
                    description: "The answer or explanation on the back of the flashcard",
                  },
                },
                required: ["front", "back"],
                additionalProperties: false,
              },
              minItems: 1,
              maxItems: 10,
            },
          },
          required: ["proposals"],
          additionalProperties: false,
        },
      },
    };
  }

  /**
   * Make low-level API call with retry logic
   */
  private async callAPI(model: string, messages: ChatMessage[], options: APICallOptions = {}): Promise<unknown> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const requestBody = {
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
          ...(options.responseFormat && { response_format: options.responseFormat }),
          ...(options.topP !== undefined && { top_p: options.topP }),
          ...(options.frequencyPenalty !== undefined && {
            frequency_penalty: options.frequencyPenalty,
          }),
          ...(options.presencePenalty !== undefined && {
            presence_penalty: options.presencePenalty,
          }),
        };

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": this.httpReferer,
            "X-Title": this.appTitle,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-OK responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || response.statusText;

          // Retry for transient errors
          if (this.shouldRetry(response.status, attempt)) {
            lastError = new Error(`API Error ${response.status}: ${errorMessage}`);
            await this.delay(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
            continue;
          }

          // Throw for non-retryable errors
          throw this.createAPIError(response.status, errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        clearTimeout(timeoutId);

        // Handle timeout
        if (error instanceof Error && error.name === "AbortError") {
          throw OpenRouterErrorFactory.create("OPENROUTER_TIMEOUT", `Request exceeded ${this.timeout}ms timeout`, {
            retryable: false,
          });
        }

        // Retry for network errors
        if (this.isNetworkError(error) && attempt < this.retryAttempts) {
          lastError = error instanceof Error ? error : new Error("Network error");
          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }

        throw error;
      }
    }

    // All retries failed
    throw lastError || new Error("All retry attempts failed");
  }

  /**
   * Determine if error qualifies for retry
   */
  private shouldRetry(statusCode: number, currentAttempt: number): boolean {
    if (currentAttempt >= this.retryAttempts) {
      return false;
    }

    // Retry for rate limit and server errors
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(statusCode);
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const networkErrorTypes = ["NetworkError", "FetchError", "ECONNRESET", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"];

    return networkErrorTypes.some((type) => error.name.includes(type) || error.message.includes(type));
  }

  /**
   * Create specialized API error
   */
  private createAPIError(statusCode: number, message: string): Error {
    const errorMap: Record<number, { code: string; retryable: boolean }> = {
      400: { code: "OPENROUTER_BAD_REQUEST", retryable: false },
      401: { code: "OPENROUTER_UNAUTHORIZED", retryable: false },
      403: { code: "OPENROUTER_FORBIDDEN", retryable: false },
      404: { code: "OPENROUTER_NOT_FOUND", retryable: false },
      429: { code: "OPENROUTER_RATE_LIMIT", retryable: true },
      500: { code: "OPENROUTER_SERVER_ERROR", retryable: true },
      502: { code: "OPENROUTER_BAD_GATEWAY", retryable: true },
      503: { code: "OPENROUTER_SERVICE_UNAVAILABLE", retryable: true },
      504: { code: "OPENROUTER_GATEWAY_TIMEOUT", retryable: true },
    };

    const errorInfo = errorMap[statusCode] || {
      code: "OPENROUTER_UNKNOWN_ERROR",
      retryable: false,
    };

    return OpenRouterErrorFactory.create(errorInfo.code, message, { statusCode, retryable: errorInfo.retryable });
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse and validate API response
   */
  private parseResponse(response: unknown): FlashcardProposalDTO[] {
    // Validate basic response structure
    if (!response || typeof response !== "object") {
      throw OpenRouterErrorFactory.create("OPENROUTER_INVALID_RESPONSE", "Response is not an object");
    }

    const apiResponse = response as {
      choices?: { message?: { content?: string } }[];
    };

    // Check for choices array
    if (!apiResponse.choices || !Array.isArray(apiResponse.choices) || apiResponse.choices.length === 0) {
      throw OpenRouterErrorFactory.create("OPENROUTER_INVALID_RESPONSE", "No choices in response");
    }

    const firstChoice = apiResponse.choices[0];

    // Check for message content
    if (!firstChoice.message || !firstChoice.message.content) {
      throw OpenRouterErrorFactory.create("OPENROUTER_INVALID_RESPONSE", "No message content in response");
    }

    const content = firstChoice.message.content;

    // Parse JSON from content
    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      throw OpenRouterErrorFactory.create(
        "OPENROUTER_INVALID_JSON",
        `Failed to parse response content as JSON: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Validate with Zod schema
    const validationResult = FlashcardProposalsSchema.safeParse(parsedContent);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      throw OpenRouterErrorFactory.create("OPENROUTER_VALIDATION_ERROR", `Response validation failed: ${errors}`);
    }

    return validationResult.data.proposals;
  }

  /**
   * Sanitize source text input
   */
  private sanitizeSourceText(text: string): string {
    // Remove control characters (eslint-disable-next-line no-control-regex)
    // eslint-disable-next-line no-control-regex
    let sanitized = text.replace(/[\x00-\x1F\x7F]/g, "");

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }
}
