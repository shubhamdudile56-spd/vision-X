/**
 * Client-side Zod schemas.
 * These mirror the server contracts so the user gets instant feedback; the
 * server re-validates everything regardless — client validation is UX only.
 */
import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name must be at most 100 characters');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: nameSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

/** Flattens a ZodError into a `{ field: message }` map. */
export function toFieldErrors(error) {
  if (!error?.issues) return {};
  return error.issues.reduce((acc, issue) => {
    const key = issue.path.join('.') || '_root';
    if (!acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
}

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const fileSchema = z
  .custom(
    (file) => (typeof File !== 'undefined' ? file instanceof File : Boolean(file)),
    'Select a file to upload'
  )
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
    message: 'Only PNG, JPEG, and WebP images are supported'
  })
  .refine((file) => file.size <= MAX_IMAGE_BYTES, {
    message: 'File must be 10MB or smaller'
  })
  .refine((file) => file.size >= 64, {
    message: 'That image looks empty or truncated'
  });

export default { registerSchema, loginSchema, fileSchema, toFieldErrors };
