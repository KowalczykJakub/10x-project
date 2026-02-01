import { describe, it, expect } from 'vitest';
import { sha256Hash } from './crypto';

describe('SHA-256 Hashing', () => {
  it('should return same hash for same input', async () => {
    const hash1 = await sha256Hash('test input');
    const hash2 = await sha256Hash('test input');
    expect(hash1).toBe(hash2);
  });

  it('should return different hash for different inputs', async () => {
    const hash1 = await sha256Hash('input 1');
    const hash2 = await sha256Hash('input 2');
    expect(hash1).not.toBe(hash2);
  });

  it('should return hex string', async () => {
    const hash = await sha256Hash('test');
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('should return 64-character hex string (256 bits = 64 hex chars)', async () => {
    const hash = await sha256Hash('test');
    expect(hash).toHaveLength(64);
  });

  it('should handle empty string', async () => {
    const hash = await sha256Hash('');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle special characters', async () => {
    const hash = await sha256Hash('Hello! @#$%^&*()');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle unicode characters', async () => {
    const hash = await sha256Hash('Zażółć gęślą jaźń 🎉');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
