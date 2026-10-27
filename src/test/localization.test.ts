import { describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE, resolveLanguage, localizedCurrency, localizedNumber, localizedDate } from '@/lib/localization';

describe('Language preferences and Indian formatting', () => {
  it('defaults to Marathi for a new farmer', () => {
    expect(DEFAULT_LANGUAGE).toBe('marathi');
    expect(resolveLanguage(null)).toBe('marathi');
  });
  it('preserves each supported saved preference', () => {
    expect(resolveLanguage('english')).toBe('english');
    expect(resolveLanguage('hindi')).toBe('hindi');
    expect(resolveLanguage('marathi')).toBe('marathi');
  });
  it('rejects unsupported saved preferences', () => {
    expect(resolveLanguage('german')).toBe('marathi');
    expect(resolveLanguage({ language: 'english' })).toBe('marathi');
  });
  it('formats Indian rupees and Marathi numbers', () => {
    expect(localizedCurrency(1250, 'english')).toBe('₹1,250.00');
    expect(localizedNumber(1250, 'marathi')).toBe('१,२५०');
    expect(localizedDate('2026-10-27T12:00:00Z', 'english')).toBe('27 October 2026');
  });
});