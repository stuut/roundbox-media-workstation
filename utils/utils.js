import { redirect } from "next/navigation"

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(type, path, message) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`)
}

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
