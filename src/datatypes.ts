/**
 * Sequelize DataType → OpenAPI 3.1 schema mapping
 *
 * Handles all Sequelize v6 DataTypes and maps them to the appropriate
 * OpenAPI 3.1 schema objects.
 */

import type { OpenAPISchemaObject, SequelizeDataType } from './types.js';

/**
 * Extract the "key" from a Sequelize DataType instance.
 * Sequelize stores it as `type.key` or `type.constructor.key`.
 */
function getTypeKey(type: SequelizeDataType): string {
  if (typeof type.key === 'string') return type.key.toUpperCase();
  if (type.constructor && typeof type.constructor.key === 'string') {
    return type.constructor.key.toUpperCase();
  }
  // Fallback: check the class name
  const ctor = type.constructor as (Function & { name?: string }) | undefined;
  if (ctor && ctor.name) {
    return ctor.name.toUpperCase();
  }
  return 'UNKNOWN';
}

/**
 * Maps a single Sequelize DataType instance to an OpenAPI 3.1 schema object.
 * Returns null for types that should be skipped (e.g. VIRTUAL).
 */
export function mapDataType(type: SequelizeDataType): OpenAPISchemaObject | null {
  const key = getTypeKey(type);

  switch (key) {
    // ─── String-like ──────────────────────────────────────────────────────────
    case 'STRING': {
      const schema: OpenAPISchemaObject = { type: 'string' };
      const options = type.options as { length?: number } | undefined;
      const length = options?.length ?? (type as { _length?: number })._length;
      if (typeof length === 'number') {
        schema.maxLength = length;
      }
      return schema;
    }

    case 'CHAR': {
      const schema: OpenAPISchemaObject = { type: 'string' };
      const options = type.options as { length?: number } | undefined;
      const length = options?.length ?? (type as { _length?: number })._length;
      if (typeof length === 'number') {
        schema.maxLength = length;
        schema.minLength = length;
      }
      return schema;
    }

    case 'TEXT':
    case 'TINYTEXT':
    case 'MEDIUMTEXT':
    case 'LONGTEXT':
    case 'CITEXT':
    case 'TSVECTOR':
      return { type: 'string' };

    // ─── Numeric ──────────────────────────────────────────────────────────────
    case 'INTEGER':
    case 'INT':
      return { type: 'integer', format: 'int32' };

    case 'TINYINT':
    case 'SMALLINT':
    case 'MEDIUMINT':
      return { type: 'integer', format: 'int32' };

    case 'BIGINT':
      return { type: 'integer', format: 'int64' };

    case 'FLOAT':
    case 'REAL':
      return { type: 'number', format: 'float' };

    case 'DOUBLE':
    case 'DOUBLE PRECISION':
      return { type: 'number', format: 'double' };

    case 'DECIMAL':
    case 'NUMERIC':
      return { type: 'number' };

    // ─── Boolean ──────────────────────────────────────────────────────────────
    case 'BOOLEAN':
    case 'BOOL':
      return { type: 'boolean' };

    // ─── Temporal ─────────────────────────────────────────────────────────────
    case 'DATE':
      return { type: 'string', format: 'date-time' };

    case 'DATEONLY':
      return { type: 'string', format: 'date' };

    case 'TIME':
      return { type: 'string', format: 'time' };

    case 'NOW':
      return { type: 'string', format: 'date-time' };

    // ─── UUID ─────────────────────────────────────────────────────────────────
    case 'UUID':
    case 'UUIDV1':
    case 'UUIDV4':
      return { type: 'string', format: 'uuid' };

    // ─── ENUM ─────────────────────────────────────────────────────────────────
    case 'ENUM': {
      // values can live in type.values or type.options.values
      const values: string[] =
        (type as { values?: string[] }).values ??
        ((type.options as { values?: string[] } | undefined)?.values) ??
        [];
      return { type: 'string', enum: values };
    }

    // ─── JSON ─────────────────────────────────────────────────────────────────
    case 'JSON':
    case 'JSONB':
      return { type: 'object' };

    // ─── Binary ───────────────────────────────────────────────────────────────
    case 'BLOB':
    case 'BINARY':
    case 'VARBINARY':
      return { type: 'string', format: 'binary' };

    // ─── Array (PostgreSQL) ───────────────────────────────────────────────────
    case 'ARRAY': {
      const innerType = (type as { type?: SequelizeDataType }).type;
      const items = innerType ? mapDataType(innerType) : { type: 'object' };
      return {
        type: 'array',
        items: items ?? { type: 'object' },
      };
    }

    // ─── Range (PostgreSQL) ───────────────────────────────────────────────────
    case 'RANGE': {
      const innerType = (type as { subtype?: SequelizeDataType }).subtype;
      const items = innerType ? mapDataType(innerType) : { type: 'number' };
      return {
        type: 'array',
        items: items ?? { type: 'number' },
        minItems: 2,
        maxItems: 2,
      };
    }

    // ─── Geometry / Geography (PostGIS) ───────────────────────────────────────
    case 'GEOMETRY':
    case 'GEOGRAPHY':
      return { type: 'object', description: 'GeoJSON geometry object' };

    case 'HSTORE':
      return { type: 'object', description: 'PostgreSQL hstore key-value object' };

    case 'CIDR':
    case 'INET':
    case 'MACADDR':
    case 'MACADDR8':
      return { type: 'string' };

    // ─── Virtual — skip ───────────────────────────────────────────────────────
    case 'VIRTUAL':
      return null;

    // ─── Fallback ─────────────────────────────────────────────────────────────
    default:
      // Unknown type — emit a generic schema with a hint
      return { type: 'string', description: `Unmapped Sequelize type: ${key}` };
  }
}
