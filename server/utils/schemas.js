/**
 * Shared Zod schemas. Every request body reaching the API is parsed through one
 * of these before any business logic or database call happens.
 */
import { z } from 'zod';

const email = z
  .string()
  .trim()
  .min(3)
  .max(255)
  .email('Enter a valid email address')
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), {
    message: 'Password must contain at least one letter and one number'
  });

const fullName = z
  .string()
  .trim()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name must be at most 100 characters');

export const registerSchema = z.object({
  email,
  password,
  full_name: fullName
});

export const loginSchema = z.object({
  email,
  // Do not re-apply the complexity rules on login: an existing legacy password
  // must still be able to sign in.
  password: z.string().min(1, 'Password is required').max(128)
});

export const boundingBoxSchema = z.object({
  x_min: z.coerce.number().min(0).max(100),
  y_min: z.coerce.number().min(0).max(100),
  x_max: z.coerce.number().min(0).max(100),
  y_max: z.coerce.number().min(0).max(100)
});

export const modeSchema = z.enum(['REAL', 'DEMO']);
export const sourceTypeSchema = z.enum(['CAMERA', 'UPLOAD']);

export const scanPayloadSchema = z.object({
  // In DEMO mode the client still sends a placeholder, so the floor is small;
  // REAL mode data URLs are fully validated in the route before any decoding.
  image_data: z
    .string()
    .min(8, 'image_data must be a Base64 payload')
    .max(15 * 1024 * 1024, 'image_data exceeds the maximum allowed size'),
  mode: modeSchema.default('REAL'),
  source_type: sourceTypeSchema.default('UPLOAD'),
  persist: z.boolean().optional().default(true)
});

export const saveScanSchema = z.object({
  mode: modeSchema.default('REAL'),
  source_type: sourceTypeSchema.default('UPLOAD'),
  image_url: z.string().min(1).max(2_000_000),
  scene_category: z.string().trim().min(1).max(100),
  scene_description: z.string().trim().min(1).max(4000),
  severity_score: z.coerce.number().min(0).max(1).default(0),
  detected_objects: z
    .array(
      z.object({
        object_name: z.string().trim().min(1).max(100),
        category: z.string().trim().min(1).max(100),
        confidence: z.coerce.number().min(0).max(100),
        bounding_box: boundingBoxSchema,
        insight: z.string().trim().max(2000).optional().default('')
      })
    )
    .max(60, 'A scan may not exceed 60 detected objects')
    .default([])
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional().default(''),
  mode: z.enum(['REAL', 'DEMO', 'ALL']).optional().default('ALL'),
  source_type: z.enum(['CAMERA', 'UPLOAD', 'ALL']).optional().default('ALL')
});

export const scanIdSchema = z.object({
  id: z.string().uuid('Invalid scan id')
});

export const createUserSchema = z.object({
  email,
  password,
  full_name: fullName,
  role: z.enum(['admin', 'inspector', 'analyst']).optional().default('inspector')
});

export default {
  registerSchema,
  loginSchema,
  scanPayloadSchema,
  saveScanSchema,
  historyQuerySchema,
  scanIdSchema,
  createUserSchema
};
