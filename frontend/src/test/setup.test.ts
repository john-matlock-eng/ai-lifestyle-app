import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should handle async tests', async () => {
    const promise = Promise.resolve('hello');
    await expect(promise).resolves.toBe('hello');
  });
});
