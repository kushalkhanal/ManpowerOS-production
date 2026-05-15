import { ZodError } from 'zod';

/**
 * validateZod — Zod-based validation middleware for request data.
 * Supports validating body, query, and params.
 *
 * Usage:
 *   validateZod(schema) - validates req.body
 *   validateZod(schema, 'query') - validates req.query
 *   validateZod(schema, 'params') - validates req.params
 *   validateZod(schema, ['body', 'query']) - validates multiple sources
 */
export const validateZod = (schema, source = 'body') => (req, res, next) => {
  try {
    const sources = Array.isArray(source) ? source : [source];
    
    sources.forEach(src => {
      if (src === 'body') {
        req.body = schema.parse(req.body);
      } else if (src === 'query') {
        req.query = schema.parse(req.query);
      } else if (src === 'params') {
        req.params = schema.parse(req.params);
      }
    });
    
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const zodIssues = Array.isArray(err.issues)
        ? err.issues
        : Array.isArray(err.errors)
          ? err.errors
          : [];

      const errors = zodIssues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code
      }));
      
      return res.status(400).json({
        success: false,
        message: errors[0]?.message || 'Validation failed',
        errors: errors
      });
    }
    next(err);
  }
};

export default validateZod;
