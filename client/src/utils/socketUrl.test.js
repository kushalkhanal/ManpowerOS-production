import { describe, expect, it } from 'vitest';
import { resolveSocketServerUrl } from './socketUrl.js';

describe('resolveSocketServerUrl', () => {
  const fallback = 'https://manpoweros.onrender.com';

  it('uses fallback when configured value is empty', () => {
    expect(resolveSocketServerUrl('', fallback)).toBe(fallback);
    expect(resolveSocketServerUrl('   ', fallback)).toBe(fallback);
    expect(resolveSocketServerUrl(undefined, fallback)).toBe(fallback);
  });

  it('uses fallback for placeholder render URL', () => {
    expect(resolveSocketServerUrl('https://your-render-backend.onrender.com', fallback)).toBe(fallback);
  });

  it('uses configured URL when valid', () => {
    expect(resolveSocketServerUrl('https://api.example.com', fallback)).toBe('https://api.example.com');
  });
});
