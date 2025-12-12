"use strict";
/**
 * Validator Implementation
 * Simple validation engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
var Validator = /** @class */ (function () {
  function Validator() {}
  /**
   * Validate data against schema
   */
  Validator.prototype.validate = function (data, schema) {
    var errors = [];
    var validatedData = {};
    this.validateObject(data, schema, "", errors, validatedData);
    return {
      isValid: errors.length === 0,
      errors: errors,
      data: validatedData,
    };
  };
  /**
   * Validate an object
   */
  Validator.prototype.validateObject = function (
    data,
    schema,
    prefix,
    errors,
    validatedData,
  ) {
    var _a;
    for (var _i = 0, _b = Object.entries(schema); _i < _b.length; _i++) {
      var _c = _b[_i],
        field = _c[0],
        rule = _c[1];
      var fieldPath = prefix ? "".concat(prefix, ".").concat(field) : field;
      var value = data === null || data === void 0 ? void 0 : data[field];
      if (this.isValidationRule(rule)) {
        this.validateField(value, rule, fieldPath, errors, validatedData);
      } else {
        // Nested object
        if (value && typeof value === "object") {
          validatedData[field] = {};
          this.validateObject(
            value,
            rule,
            fieldPath,
            errors,
            validatedData[field],
          );
        } else if (
          (_a = rule[field]) === null || _a === void 0 ? void 0 : _a.required
        ) {
          errors.push({
            field: fieldPath,
            message: "This field is required",
            value: value,
          });
        }
      }
    }
  };
  /**
   * Validate a single field
   */
  Validator.prototype.validateField = function (
    value,
    rule,
    fieldPath,
    errors,
    validatedData,
  ) {
    var fieldName = fieldPath.split(".").pop();
    // Required validation
    if (
      rule.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push({
        field: fieldPath,
        message: "".concat(fieldName, " is required"),
        value: value,
      });
      return;
    }
    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      return;
    }
    // Type validation
    if (rule.type && !this.validateType(value, rule.type)) {
      errors.push({
        field: fieldPath,
        message: "".concat(fieldName, " must be a ").concat(rule.type),
        value: value,
      });
      return;
    }
    // String validations
    if (typeof value === "string") {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: fieldPath,
          message: ""
            .concat(fieldName, " must be at least ")
            .concat(rule.minLength, " characters long"),
          value: value,
        });
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: fieldPath,
          message: ""
            .concat(fieldName, " must be no more than ")
            .concat(rule.maxLength, " characters long"),
          value: value,
        });
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: fieldPath,
          message: "".concat(fieldName, " format is invalid"),
          value: value,
        });
      }
    }
    // Number validations
    if (typeof value === "number") {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: fieldPath,
          message: "".concat(fieldName, " must be at least ").concat(rule.min),
          value: value,
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: fieldPath,
          message: ""
            .concat(fieldName, " must be no more than ")
            .concat(rule.max),
          value: value,
        });
      }
    }
    // Custom validation
    if (rule.custom) {
      var customResult = rule.custom(value);
      if (customResult !== true) {
        errors.push({
          field: fieldPath,
          message:
            typeof customResult === "string"
              ? customResult
              : "".concat(fieldName, " is invalid"),
          value: value,
        });
      }
    }
    // If no errors, add to validated data
    if (
      errors.filter(function (e) {
        return e.field === fieldPath;
      }).length === 0
    ) {
      validatedData[fieldName] = value;
    }
  };
  /**
   * Validate type
   */
  Validator.prototype.validateType = function (value, type) {
    switch (type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "array":
        return Array.isArray(value);
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      case "email":
        return (
          typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        );
      case "date":
        return (
          value instanceof Date ||
          (typeof value === "string" && !isNaN(Date.parse(value)))
        );
      default:
        return true;
    }
  };
  /**
   * Check if rule is a ValidationRule
   */
  Validator.prototype.isValidationRule = function (rule) {
    return (
      rule &&
      typeof rule === "object" &&
      !Array.isArray(rule) &&
      !this.isSchema(rule)
    );
  };
  /**
   * Check if rule is a schema
   */
  Validator.prototype.isSchema = function (rule) {
    return (
      rule &&
      typeof rule === "object" &&
      !Array.isArray(rule) &&
      Object.keys(rule).some(function (key) {
        var value = rule[key];
        return value && typeof value === "object" && !Array.isArray(value);
      })
    );
  };
  /**
   * Create common validation schemas
   */
  Validator.schemas = {
    email: {
      type: "email",
      required: true,
    },
    password: {
      type: "string",
      required: true,
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      custom: function (value) {
        if (!/(?=.*[!@#$%^&*])/.test(value)) {
          return "Password must contain at least one special character";
        }
        return true;
      },
    },
    name: {
      type: "string",
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    positiveNumber: {
      type: "number",
      required: true,
      min: 0,
    },
  };
  return Validator;
})();
exports.Validator = Validator;
exports.default = Validator;
