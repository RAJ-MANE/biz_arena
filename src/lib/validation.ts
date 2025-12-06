import { z } from 'zod';

// Common validation schemas for API endpoints
export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, dashes, and underscores'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters'),
});

export const registrationSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, dashes, and underscores'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, apostrophes, and hyphens'),
  teamName: z.string()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be less than 100 characters'),
  college: z.string()
    .min(2, 'College name must be at least 2 characters')
    .max(200, 'College name must be less than 200 characters'),
});

export const teamIdSchema = z.object({
  teamId: z.number().int().positive('Team ID must be a positive integer'),
});

export const questionSchema = z.object({
  text: z.string()
    .min(10, 'Question text must be at least 10 characters')
    .max(1000, 'Question text must be less than 1000 characters'),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  maxTokenPerQuestion: z.number().int().min(1).max(4, 'Max tokens must be between 1 and 4'),
});

export const optionSchema = z.object({
  questionId: z.number().int().positive('Question ID must be a positive integer'),
  text: z.string()
    .min(5, 'Option text must be at least 5 characters')
    .max(500, 'Option text must be less than 500 characters'),
  order: z.number().int().min(0, 'Order must be a non-negative integer'),
  tokenDeltaMarketing: z.number().int().min(-4).max(4),
  tokenDeltaCapital: z.number().int().min(-4).max(4),
  tokenDeltaTeam: z.number().int().min(-4).max(4),
  tokenDeltaStrategy: z.number().int().min(-4).max(4),
});

export const voteSchema = z.object({
  teamId: z.number().int().positive('Team ID must be a positive integer'),
  isUpvote: z.boolean(),
});

export const ratingSchema = z.object({
  teamId: z.number().int().positive('Team ID must be a positive integer'),
  judgeId: z.string().min(1, 'Judge ID is required'),
  score: z.number().min(0).max(10, 'Score must be between 0 and 10'),
});

export const pitchSchema = z.object({
  teamId: z.number().int().positive('Team ID must be a positive integer'),
  videoUrl: z.string().url('Video URL must be a valid URL').optional().or(z.literal('')),
  deckUrl: z.string().url('Deck URL must be a valid URL').optional().or(z.literal('')),
});

// Security utility functions
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potential XSS characters
    .slice(0, 1000); // Limit length
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Rate limiting utilities
export function createRateLimitKey(ip: string, route: string): string {
  return `rate_limit:${ip}:${route}`;
}

// Input validation errors
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validate and sanitize API request data
export function validateApiInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new ValidationError(firstError.message, firstError.path.join('.'));
    }
    throw new ValidationError('Invalid input data');
  }
}