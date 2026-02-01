import { describe, it, expect } from 'vitest';
import { OpenRouterService } from './openrouter.service';

describe('OpenRouterService', () => {
  describe('Initialization', () => {
    it('should throw error with empty API key', () => {
      expect(() => new OpenRouterService('')).toThrow('API key is required');
    });

    it('should throw error with whitespace-only API key', () => {
      expect(() => new OpenRouterService('   ')).toThrow(
        'API key is required'
      );
    });

    it('should throw error with invalid base URL (not HTTPS)', () => {
      expect(
        () =>
          new OpenRouterService('test-key', {
            baseUrl: 'http://insecure.com',
          })
      ).toThrow('must use HTTPS');
    });

    it('should throw error with invalid timeout (zero)', () => {
      expect(
        () =>
          new OpenRouterService('test-key', {
            timeout: 0,
          })
      ).toThrow('Timeout must be greater than 0');
    });

    it('should throw error with negative timeout', () => {
      expect(
        () =>
          new OpenRouterService('test-key', {
            timeout: -1000,
          })
      ).toThrow('Timeout must be greater than 0');
    });

    it('should throw error with negative retry attempts', () => {
      expect(
        () =>
          new OpenRouterService('test-key', {
            retryAttempts: -1,
          })
      ).toThrow('Retry attempts cannot be negative');
    });

    it('should initialize with valid config', () => {
      expect(() => new OpenRouterService('test-key')).not.toThrow();
    });

    it('should initialize with custom options', () => {
      expect(
        () =>
          new OpenRouterService('test-key', {
            baseUrl: 'https://custom-api.example.com',
            timeout: 60000,
            retryAttempts: 3,
            defaultModel: 'gpt-4',
          })
      ).not.toThrow();
    });
  });

  describe('Text sanitization', () => {
    it('should trim whitespace', () => {
      const service = new OpenRouterService('test-key');
      // Access private method through type assertion for testing
      const result = (service as any).sanitizeSourceText('  test  ');
      expect(result).toBe('test');
    });

    it('should remove control characters', () => {
      const service = new OpenRouterService('test-key');
      const result = (service as any).sanitizeSourceText('test\x00\x01text');
      expect(result).toBe('testtext');
    });

    it('should handle text with multiple spaces', () => {
      const service = new OpenRouterService('test-key');
      const result = (service as any).sanitizeSourceText('hello  world');
      expect(result).toBe('hello  world');
    });

    it('should remove multiple control characters', () => {
      const service = new OpenRouterService('test-key');
      const result = (service as any).sanitizeSourceText(
        'hello\x00world\x01test\x7F'
      );
      expect(result).toBe('helloworldtest');
    });
  });
});
