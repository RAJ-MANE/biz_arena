import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a production-safe error response that doesn't leak sensitive information
 * @param error - The original error object
 * @param defaultMessage - Default message to show in production
 * @param statusCode - HTTP status code
 * @returns Object with sanitized error message and status code
 */
export function createSafeErrorResponse(
  error: unknown,
  defaultMessage: string = "An error occurred",
  statusCode: number = 500
) {
  // In development, show detailed error information
  if (process.env.NODE_ENV === "development") {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return {
      error: errorMessage,
      details: errorStack,
      statusCode
    };
  }

  // In production, only show safe, generic messages
  return {
    error: defaultMessage,
    statusCode
  };
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 * @param input - The input string to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>'"&]/g, '') // Remove HTML characters
    .trim()
    .substring(0, 1000); // Limit length
}

// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting function
 * @param identifier - Unique identifier for the client (e.g., IP address)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object indicating if request is allowed and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment counter
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime
  };
}
