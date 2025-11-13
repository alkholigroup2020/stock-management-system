/**
 * Authentication Utilities
 * Password hashing, verification, and validation functions
 */

import bcrypt from "bcrypt";
import { z } from "zod";

/**
 * Number of salt rounds for bcrypt hashing
 * Higher = more secure but slower
 * 10 rounds is recommended for production (2^10 = 1024 iterations)
 */
const SALT_ROUNDS = 10;

/**
 * Password strength requirements
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/**
 * Zod schema for password validation
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  })
  .regex(PASSWORD_REGEX, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
  });

/**
 * Password strength validation result
 */
export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
}

/**
 * Hash a plain text password using bcrypt
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 * @throws Error if hashing fails
 *
 * @example
 * const hashedPassword = await hashUserPassword('MySecurePass123!');
 */
export async function hashUserPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error(
      `Failed to hash password: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Verify a plain text password against a hashed password
 *
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 *
 * @example
 * const isValid = await verifyUserPassword('MySecurePass123!', hashedPassword);
 * if (isValid) {
 *   // Password is correct
 * }
 */
export async function verifyUserPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("🚀 ~ verifyUserPassword ~ error:", error);
    // If verification fails, return false (invalid password)
    // Don't throw error to avoid leaking information
    return false;
  }
}

/**
 * Validate password strength and return detailed feedback
 *
 * @param password - Plain text password to validate
 * @returns PasswordStrengthResult with validation details
 *
 * @example
 * const result = validatePasswordStrength('weak');
 * if (!result.valid) {
 *   console.error('Password errors:', result.errors);
 * }
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];
  let strength: "weak" | "medium" | "strong" = "weak";

  // Check minimum length
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check for number
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check for special character
  if (!/[@$!%*?&]/.test(password)) {
    errors.push("Password must contain at least one special character (@$!%*?&)");
  }

  // Determine strength
  const hasMinLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);

  const criteriaMet = [hasMinLength, hasLowercase, hasUppercase, hasNumber, hasSpecial].filter(
    Boolean
  ).length;

  if (criteriaMet === 5 && password.length >= 12) {
    strength = "strong";
  } else if (criteriaMet >= 4) {
    strength = "medium";
  } else {
    strength = "weak";
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Validate password using Zod schema
 * Throws ZodError if validation fails
 *
 * @param password - Plain text password to validate
 * @returns true if valid
 * @throws ZodError if validation fails
 *
 * @example
 * try {
 *   validatePassword('MySecurePass123!');
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     console.error('Validation errors:', error.errors);
 *   }
 * }
 */
export function validatePassword(password: string): boolean {
  passwordSchema.parse(password);
  return true;
}
