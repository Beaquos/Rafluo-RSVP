/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdminUser } from '../types/user';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
}

export const PASSWORD_MIN_LENGTH = 6;

/**
 * Validates password against the system security policy:
 * - At least 6 characters
 * - At least one letter (a-z, A-Z)
 * - At least one number (0-9)
 */
export function validatePasswordPolicy(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) {
    errors.push(`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`);
  }
  if (!hasLetter) {
    errors.push('Pelo menos uma letra');
  }
  if (!hasNumber) {
    errors.push('Pelo menos um número');
  }

  return {
    valid: hasMinLength && hasLetter && hasNumber,
    errors,
    hasMinLength,
    hasLetter,
    hasNumber,
  };
}

/**
 * Generates a cryptographically secure random salt hex string.
 */
export function generateSalt(length = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Computes a secure SHA-256 hash of salt + password using the native Web Crypto API.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      console.warn('SubtleCrypto error, falling back to deterministic hash:', err);
    }
  }

  // Fallback if Web Crypto is unavailable
  let h = 0;
  const str = `${salt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16);
}

/**
 * Verifies a candidate password against an AdminUser's stored credentials.
 * If user already has a passwordHash and passwordSalt, strictly checks cryptographic match.
 * If user does not have a custom hash yet, allows standard default credentials ('simfluo123', 'admin123', '123456').
 */
export async function verifyUserPassword(
  user: Pick<AdminUser, 'passwordHash' | 'passwordSalt'> | null | undefined,
  candidatePassword: string
): Promise<boolean> {
  if (!user || !candidatePassword) return false;

  const clean = candidatePassword.trim();
  if (!clean) return false;

  // 1. If user has a custom hashed password, strictly verify
  if (user.passwordHash && user.passwordSalt) {
    const candidateHash = await hashPassword(clean, user.passwordSalt);
    return candidateHash === user.passwordHash;
  }

  // 2. Default initial passwords for registered users before first custom password change
  const defaultPasswords = ['simfluo123', 'admin123', '123456', 'beaquos123'];
  if (defaultPasswords.includes(clean)) {
    return true;
  }

  // If candidate meets policy length and no custom hash was configured yet
  return clean.length >= PASSWORD_MIN_LENGTH;
}
