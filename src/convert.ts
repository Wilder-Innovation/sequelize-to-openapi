/**
 * Core conversion logic: Sequelize Model → OpenAPI 3.1 Schema Object
 */

import { mapDataType } from './datatypes.js';
import { applyValidations } from './validations.js';
import type {
  ModelSchemaObject,
  OpenAPISchemaObject,
  Options,
  RawAttribute,
  SequelizeModelClass,
} from './types.js';

/** Sequelize-managed field names that we treat as "internals" */
const SEQUELIZE_INTERNALS = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt']);

/**
 * Determines whether a field should be included in the `required` array.
 *
 * Rules:
 * - Must have allowNull: false  (Sequelize default is true)
 * - Must NOT have a defaultValue
 * - Must NOT be an auto-increment primary key (those are DB-generated)
 */
function isRequired(attr: RawAttribute): boolean {
  if (attr.allowNull !== false) return false;
  if (attr.defaultValue !== undefined && attr.defaultValue !== null) return false;
  if (attr.autoIncrement || attr.autoIncrementIdentity) return false;
  return true;
}

/**
 * Converts a single Sequelize rawAttribute definition into an OpenAPI schema object.
 */
function convertAttribute(
  attr: RawAttribute,
  extraProps: string[],
): OpenAPISchemaObject | null {
  // Map the DataType
  const base = mapDataType(attr.type);
  if (base === null) {
    // VIRTUAL or explicitly skipped
    return null;
  }

  const schema: OpenAPISchemaObject = { ...base };

  // ── comment → description ────────────────────────────────────────────────
  if (typeof attr.comment === 'string' && attr.comment.trim()) {
    schema.description = attr.comment;
  }

  // ── defaultValue → default ───────────────────────────────────────────────
  if (attr.defaultValue !== undefined && attr.defaultValue !== null) {
    // Skip Sequelize sentinel objects (e.g. Sequelize.NOW, fn(), etc.)
    // Those are objects with a special `val` or internal marker
    if (
      typeof attr.defaultValue !== 'object' ||
      Array.isArray(attr.defaultValue)
    ) {
      schema.default = attr.defaultValue;
    }
  }

  // ── readOnly for auto-increment PKs ──────────────────────────────────────
  if (attr.primaryKey && (attr.autoIncrement || attr.autoIncrementIdentity)) {
    schema.readOnly = true;
  }

  // ── Validations ──────────────────────────────────────────────────────────
  if (attr.validate && typeof attr.validate === 'object') {
    applyValidations(schema, attr.validate as Record<string, unknown>);
  }

  // ── Extra props (user-specified whitelist) ────────────────────────────────
  for (const prop of extraProps) {
    if (prop in attr && attr[prop] !== undefined) {
      schema[prop] = attr[prop];
    }
  }

  return schema;
}

/**
 * Main conversion function.
 * Takes a Sequelize Model class and returns an OpenAPI 3.1 schema object.
 */
export function convert(Model: SequelizeModelClass, options: Options = {}): ModelSchemaObject {
  const {
    omitFields = [],
    props: extraProps = [],
    omitSequelizeInternals = false,
    includeRequired = true,
    title,
    includeAssociations = false,
  } = options;

  const rawAttrs = Model.rawAttributes ?? {};
  const properties: Record<string, OpenAPISchemaObject> = {};
  const required: string[] = [];

  // Build a set of fields to skip
  const omitSet = new Set(omitFields);
  if (omitSequelizeInternals) {
    for (const intern of SEQUELIZE_INTERNALS) omitSet.add(intern);
  }

  for (const [fieldName, attr] of Object.entries(rawAttrs)) {
    // Skip omitted fields
    if (omitSet.has(fieldName)) continue;

    // Convert the attribute
    const schema = convertAttribute(attr, extraProps);
    if (schema === null) continue; // VIRTUAL / skipped

    properties[fieldName] = schema;

    // Collect required fields
    if (includeRequired && isRequired(attr)) {
      required.push(fieldName);
    }
  }

  // ── Associations ─────────────────────────────────────────────────────────
  if (includeAssociations && Model.associations) {
    for (const [, association] of Object.entries(Model.associations)) {
      const assocName = association.as ?? association.target?.name;
      if (!assocName) continue;

      const targetName = association.target?.name ?? assocName;
      const assocType = association.associationType;

      if (assocType === 'HasMany' || assocType === 'BelongsToMany') {
        properties[assocName] = {
          type: 'array',
          items: { $ref: `#/components/schemas/${targetName}` },
        };
      } else if (assocType === 'HasOne' || assocType === 'BelongsTo') {
        properties[assocName] = {
          $ref: `#/components/schemas/${targetName}`,
        };
      }
    }
  }

  // ── Assemble the schema ───────────────────────────────────────────────────
  const schema: ModelSchemaObject = {
    title: title ?? Model.name,
    type: 'object',
    properties,
  };

  if (includeRequired && required.length > 0) {
    schema.required = required;
  }

  return schema;
}
