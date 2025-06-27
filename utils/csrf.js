import crypto from 'crypto';
import { cookies } from 'next/headers';

export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function validateCSRFToken(requestToken) {
  const cookie = await cookies()
  const csrfToken = cookie.get('csrfToken')?.value || '';
  return csrfToken === requestToken;
}
