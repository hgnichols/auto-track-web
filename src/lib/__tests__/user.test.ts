import { describe, expect, it } from 'vitest';
import { isEmailConfirmed } from '../user';

describe('isEmailConfirmed', () => {
  it('returns false when candidate is null', () => {
    expect(isEmailConfirmed(null)).toBe(false);
  });

  it('returns false when timestamps are empty', () => {
    expect(
      isEmailConfirmed({
        email_confirmed_at: '',
        confirmed_at: null
      })
    ).toBe(false);
  });

  it('returns true when email_confirmed_at is populated', () => {
    expect(
      isEmailConfirmed({
        email_confirmed_at: '2024-06-01T12:00:00Z',
        confirmed_at: null
      })
    ).toBe(true);
  });

  it('returns true when only confirmed_at is populated', () => {
    expect(
      isEmailConfirmed({
        email_confirmed_at: null,
        confirmed_at: '2024-06-01T12:00:00Z'
      })
    ).toBe(true);
  });
});
