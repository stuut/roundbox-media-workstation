import { generateCSRFToken } from '@/utils/csrf';
import { NextResponse } from 'next/server';

export async function GET() {
  const csrfToken = generateCSRFToken();

  // Set CSRF token in a secure cookie
  const response = NextResponse.json({ csrfToken });
  response.headers.set(
    'Set-Cookie',
    `csrfToken=${csrfToken}; Secure; SameSite=Strict; Path=/`
  );

  return response;
}
