/**
 * Sequelize validate:{} → OpenAPI 3.1 constraint mapping
 *
 * Extracts validation rules from Sequelize attribute definitions and
 * merges them into the OpenAPI schema object for that property.
 */

import type { OpenAPISchemaObject } from './types.js';

type ValidateMap = Record<string, unknown>;

/**
 * Merges Sequelize validate:{} constraints into an existing OpenAPI schema object.
 * Mutates and returns the schema for easy chaining.
 */
export function applyValidations(
  schema: OpenAPISchemaObject,
  validate: ValidateMap,
): OpenAPISchemaObject {
  if (!validate || typeof validate !== 'object') return schema;

  for (const [ruleName, ruleValue] of Object.entries(validate)) {
    switch (ruleName) {
      // ─── Length ─────────────────────────────────────────────────────────────
      case 'len': {
        // len: [min, max]  or  len: { args: [min, max] }
        const args = extractArgs(ruleValue) as number[] | null;
        if (Array.isArray(args) && args.length >= 1) {
          if (typeof args[0] === 'number' && args[0] > 0) {
            schema.minLength = args[0];
          }
          if (args.length >= 2 && typeof args[1] === 'number') {
            schema.maxLength = args[1];
          }
        }
        break;
      }

      // ─── Numeric bounds ─────────────────────────────────────────────────────
      case 'min': {
        const val = extractScalar(ruleValue);
        if (typeof val === 'number') schema.minimum = val;
        break;
      }

      case 'max': {
        const val = extractScalar(ruleValue);
        if (typeof val === 'number') schema.maximum = val;
        break;
      }

      // ─── Format hints ───────────────────────────────────────────────────────
      case 'isEmail':
        if (isTruthy(ruleValue)) schema.format = 'email';
        break;

      case 'isUrl':
      case 'isURL':
        if (isTruthy(ruleValue)) schema.format = 'uri';
        break;

      case 'isUUID':
        if (isTruthy(ruleValue)) schema.format = 'uuid';
        break;

      // ─── Pattern hints ──────────────────────────────────────────────────────
      case 'isAlpha':
        if (isTruthy(ruleValue)) schema.pattern = '^[a-zA-Z]+$';
        break;

      case 'isAlphanumeric':
        if (isTruthy(ruleValue)) schema.pattern = '^[a-zA-Z0-9]+$';
        break;

      case 'isNumeric':
        if (isTruthy(ruleValue)) schema.pattern = '^[0-9]+$';
        break;

      case 'isLowercase':
        if (isTruthy(ruleValue)) schema.pattern = '^[a-z]+$';
        break;

      case 'isUppercase':
        if (isTruthy(ruleValue)) schema.pattern = '^[A-Z]+$';
        break;

      // ─── Not-empty ──────────────────────────────────────────────────────────
      case 'notEmpty':
        if (isTruthy(ruleValue)) {
          // Don't override a larger minLength set by `len`
          if (!schema.minLength || schema.minLength < 1) {
            schema.minLength = 1;
          }
        }
        break;

      // ─── Enum ───────────────────────────────────────────────────────────────
      case 'isIn': {
        // isIn: [[value1, value2]] or isIn: { args: [[value1, value2]] }
        const args = extractArgs(ruleValue) as unknown[][] | null;
        if (Array.isArray(args) && Array.isArray(args[0])) {
          schema.enum = args[0] as unknown[];
        } else if (Array.isArray(args)) {
          schema.enum = args as unknown[];
        }
        break;
      }

      // ─── Not-in (no direct OpenAPI equivalent — skip) ───────────────────────
      case 'notIn':
        break;

      // ─── IP address ─────────────────────────────────────────────────────────
      case 'isIPv4':
        if (isTruthy(ruleValue)) schema.format = 'ipv4';
        break;

      case 'isIPv6':
        if (isTruthy(ruleValue)) schema.format = 'ipv6';
        break;

      case 'isIP':
        // Could be v4 or v6; leave format generic
        break;

      // ─── Custom regex via `is` ───────────────────────────────────────────────
      case 'is': {
        // is: /regex/  or  is: ['^pattern$', 'i']  or  is: { args: [...] }
        const pattern = extractRegexPattern(ruleValue);
        if (pattern) schema.pattern = pattern;
        break;
      }

      // ─── Everything else — ignore ────────────────────────────────────────────
      default:
        break;
    }
  }

  return schema;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the validation value should be treated as "enabled".
 */
function isTruthy(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'object' && value !== null) return true;
  return Boolean(value);
}

/**
 * Extracts the args array from either a raw array or an { args: [...] } object.
 */
function extractArgs(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.args)) return obj.args;
  }
  return null;
}

/**
 * Extracts a scalar numeric value from a plain number or { args: number } shape.
 */
function extractScalar(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.args === 'number') return obj.args;
    if (Array.isArray(obj.args) && typeof obj.args[0] === 'number') return obj.args[0];
  }
  return null;
}

/**
 * Extracts a regex pattern string from various Sequelize `is` formats.
 * Returns null if unable to extract.
 */
function extractRegexPattern(value: unknown): string | null {
  if (value instanceof RegExp) return value.source;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (obj.args instanceof RegExp) return obj.args.source;
    const args = obj.args;
    if (Array.isArray(args) && args[0] instanceof RegExp) return args[0].source;
    if (Array.isArray(args) && typeof args[0] === 'string') return args[0];
  }
  return null;
}
