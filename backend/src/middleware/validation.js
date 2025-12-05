import Joi from 'joi';
import { ApiError } from './errorHandler.js';

// Common validation schemas
const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().email().required().label('Email'),
    password: Joi.string().min(6).required().label('Password'),
  }),

  // User schemas
  createUser: Joi.object({
    name: Joi.string().min(2).max(100).required().label('Name'),
    email: Joi.string().email().required().label('Email'),
    password: Joi.string().min(6).required().label('Password'),
    role: Joi.string().valid('user', 'assistant_manager', 'manager', 'admin').default('user'),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100).label('Name'),
    email: Joi.string().email().label('Email'),
    password: Joi.string().min(6).label('Password'),
    role: Joi.string().valid('user', 'assistant_manager', 'manager', 'admin'),
    isActive: Joi.boolean(),
  }).min(1), // At least one field is required for update

  // Report schemas
  createReport: Joi.object({
    title: Joi.string().min(3).max(255).required().label('Title'),
    amount: Joi.number().min(0).required().label('Amount'),
    description: Joi.string().allow('').optional().label('Description'),
  }),

  updateReport: Joi.object({
    title: Joi.string().min(3).max(255).label('Title'),
    amount: Joi.number().min(0).label('Amount'),
    description: Joi.string().allow('').optional().label('Description'),
  }).min(1), // At least one field is required for update

  // Pagination and filtering
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('-createdAt'),
    search: Joi.string().allow('').optional(),
    status: Joi.string().valid('active', 'inactive', 'pending').optional(),
  }),
};

/**
 * Validate request data against a Joi schema
 * @param {string} schemaName - Name of the schema to validate against
 * @param {string} [source='body'] - Request property to validate (body, params, query)
 * @returns {Function} Express middleware function
 */
const validate = (schemaName, source = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new ApiError(500, `Validation schema '${schemaName}' not found`));
    }

    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Return all validation errors, not just the first one
      allowUnknown: false, // Don't allow unknown keys
      stripUnknown: true, // Remove unknown keys
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message.replace(/\"/g, ''))
        .join(', ');
      return next(new ApiError(400, errorMessage));
    }

    // Replace the request data with the validated and sanitized data
    req[source] = value;
    next();
  };
};

export default {
  validate,
  schemas,
};
