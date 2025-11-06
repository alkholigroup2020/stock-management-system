/**
 * Test endpoint for password hashing utilities
 * POST /api/auth/test-password
 *
 * Tests:
 * - Password hashing
 * - Password verification
 * - Password strength validation
 */

import { z } from "zod";

const testPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event);
    const { password } = testPasswordSchema.parse(body);

    // Test 1: Validate password strength
    const strengthResult = validatePasswordStrength(password);

    // Test 2: Hash the password
    let hashedPassword = "";
    let hashError = null;

    try {
      hashedPassword = await hashUserPassword(password);
    } catch (error) {
      hashError = error instanceof Error ? error.message : "Unknown error";
    }

    // Test 3: Verify the password (if hashing succeeded)
    let verificationResult = null;
    if (hashedPassword && !hashError) {
      const correctPassword = await verifyUserPassword(
        password,
        hashedPassword
      );
      const wrongPassword = await verifyUserPassword(
        "WrongPassword123!",
        hashedPassword
      );

      verificationResult = {
        correctPassword,
        wrongPassword,
        success: correctPassword === true && wrongPassword === false,
      };
    }

    // Test 4: Zod validation
    const zodValidation = { valid: false, error: null as string | null };
    try {
      validatePassword(password);
      zodValidation.valid = true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        zodValidation.error = error.issues
          .map((e: any) => e.message)
          .join(", ");
      }
    }

    return {
      success: true,
      input: {
        password,
        length: password.length,
      },
      tests: {
        strengthValidation: strengthResult,
        hashing: {
          success: !!hashedPassword && !hashError,
          hashedPassword: hashedPassword
            ? `${hashedPassword.substring(0, 20)}...`
            : null,
          error: hashError,
        },
        verification: verificationResult,
        zodValidation,
      },
      allTestsPassed:
        strengthResult.valid &&
        !!hashedPassword &&
        !hashError &&
        verificationResult?.success &&
        zodValidation.valid,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          errors: error.issues,
        },
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "TEST_ERROR",
        message: "Failed to test password utilities",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
