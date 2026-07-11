import { describe, expect, it } from 'vitest';
import { cn } from './cn.js';

describe('cn', () => {
  it('joins truthy class values', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });

  it('resolves conflicting Tailwind utilities, last one winning', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
