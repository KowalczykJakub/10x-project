import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, emailSchema, passwordSchema } from "./auth.schema";

describe("Auth Schema Validation", () => {
  describe("Email validation", () => {
    it("should accept valid email", () => {
      const result = emailSchema.safeParse("user@example.com");
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = emailSchema.safeParse("invalid-email");
      expect(result.success).toBe(false);
    });

    it("should reject empty email", () => {
      const result = emailSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("Password validation (login)", () => {
    it("should accept password with 6+ chars", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "Test123!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject password under 6 chars", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Password validation (registration)", () => {
    it("should accept strong password", () => {
      const result = passwordSchema.safeParse("Test123!@");
      expect(result.success).toBe(true);
    });

    it("should reject password without uppercase", () => {
      const result = passwordSchema.safeParse("test123!@");
      expect(result.success).toBe(false);
    });

    it("should reject password without digit", () => {
      const result = passwordSchema.safeParse("TestTest!@");
      expect(result.success).toBe(false);
    });

    it("should reject password without special char", () => {
      const result = passwordSchema.safeParse("Test1234");
      expect(result.success).toBe(false);
    });

    it("should reject password under 8 chars", () => {
      const result = passwordSchema.safeParse("Test1!");
      expect(result.success).toBe(false);
    });
  });

  describe("Register schema", () => {
    it("should accept matching passwords", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "Test123!@",
        confirmPassword: "Test123!@",
      });
      expect(result.success).toBe(true);
    });

    it("should reject non-matching passwords", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "Test123!@",
        confirmPassword: "Different123!@",
      });
      expect(result.success).toBe(false);
    });
  });
});
