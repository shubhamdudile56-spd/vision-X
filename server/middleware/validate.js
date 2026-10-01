/**
 * Zod request validation middleware.
 * Replaces the request segment with the parsed (coerced, trimmed) value so
 * handlers only ever see validated data.
 */
import { badRequest } from '../utils/errors.js';

function formatIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message
  }));
}

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(badRequest('Validation failed', formatIssues(result.error)));
    }
    if (source === 'query') {
      // Express 4 exposes req.query as a getter-only property on some versions.
      Object.defineProperty(req, 'validatedQuery', { value: result.data, writable: true, configurable: true });
    } else {
      req[source] = result.data;
    }
    return next();
  };
}

/** Validator that does not mutate the request — returns the parsed value. */
export function parseOrThrow(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw badRequest('Validation failed', formatIssues(result.error));
  }
  return result.data;
}

export default { validate, parseOrThrow };
