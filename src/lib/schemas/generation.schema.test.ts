import { describe, it, expect } from "vitest";
import { CreateGenerationSchema } from "./generation.schema";

describe("Generation Schema Validation", () => {
  it("should accept text between 1000-10000 chars", () => {
    const text = "A".repeat(5000);
    const result = CreateGenerationSchema.safeParse({ source_text: text });
    expect(result.success).toBe(true);
  });

  it("should reject text under 1000 chars", () => {
    const text = "Too short";
    const result = CreateGenerationSchema.safeParse({ source_text: text });
    expect(result.success).toBe(false);
  });

  it("should reject text over 10000 chars", () => {
    const text = "A".repeat(15000);
    const result = CreateGenerationSchema.safeParse({ source_text: text });
    expect(result.success).toBe(false);
  });

  it("should reject whitespace-only text", () => {
    const text = " ".repeat(5000);
    const result = CreateGenerationSchema.safeParse({ source_text: text });
    expect(result.success).toBe(false);
  });
});
