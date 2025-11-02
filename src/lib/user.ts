export type EmailConfirmationLike = {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

export function isEmailConfirmed(candidate: EmailConfirmationLike | null | undefined): boolean {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const { email_confirmed_at: emailConfirmedAt, confirmed_at: confirmedAt } = candidate;
  const timestamp = typeof emailConfirmedAt === 'string' && emailConfirmedAt.length > 0
    ? emailConfirmedAt
    : typeof confirmedAt === 'string' && confirmedAt.length > 0
      ? confirmedAt
      : null;

  return typeof timestamp === 'string' && timestamp.length > 0;
}
