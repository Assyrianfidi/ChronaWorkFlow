import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ApiError } from '../utils/error';

type ValidationSchema = {
  body?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
};

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ApiError(400, `Validation error: ${message}`));
      } else {
        next(error);
      }
    }
  };
};

export function validateMultiple(schemas: {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const [target, schema] of Object.entries(schemas)) {
        if (!schema) continue;
        
        const result = schema.safeParse(req[target as keyof typeof schemas]);
        
        if (!result.success) {
          const errors = result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          }));
          
          throw new ApiError(400, 'Validation error', true, errors as any);
        }
        
        // Replace the request data with the validated and parsed data
        req[target as keyof typeof schemas] = result.data;
      }
      
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      
      if (error instanceof ZodError) {
        return next(new ApiError(400, 'Validation error', true, error.errors as any));
      }
      
      next(new ApiError(500, 'Internal server error'));
    }
  };
}
