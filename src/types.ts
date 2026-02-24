/**
 * TypeScript types for sequelize-to-openapi
 */

/**
 * OpenAPI 3.1 Schema Object (subset used by this library)
 */
export interface OpenAPISchemaObject {
  type?: string | string[];
  format?: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  items?: OpenAPISchemaObject;
  properties?: Record<string, OpenAPISchemaObject>;
  required?: string[];
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  allOf?: OpenAPISchemaObject[];
  oneOf?: OpenAPISchemaObject[];
  anyOf?: OpenAPISchemaObject[];
  $ref?: string;
  example?: unknown;
  [key: string]: unknown;
}

/**
 * Top-level OpenAPI 3.1 Schema Object for a model
 */
export interface ModelSchemaObject extends OpenAPISchemaObject {
  title: string;
  type: 'object';
  properties: Record<string, OpenAPISchemaObject>;
}

/**
 * Options for sequelize-to-openapi conversion
 */
export interface Options {
  /**
   * Fields to exclude from output (e.g. ['password', 'internalNote'])
   */
  omitFields?: string[];

  /**
   * Extra model-level attribute props to include in schema properties
   * (e.g. ['description', 'example'] — whitelist non-standard meta props)
   */
  props?: string[];

  /**
   * Whether to omit Sequelize internals: id, createdAt, updatedAt, deletedAt
   * @default false
   */
  omitSequelizeInternals?: boolean;

  /**
   * Whether to include the 'required' array
   * @default true
   */
  includeRequired?: boolean;

  /**
   * Title override (default: model name)
   */
  title?: string;

  /**
   * Whether to include association references in the schema
   * @default false
   */
  includeAssociations?: boolean;
}

/**
 * Internal attribute definition (Sequelize rawAttributes shape)
 */
export interface RawAttribute {
  type: SequelizeDataType;
  allowNull?: boolean;
  defaultValue?: unknown;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  autoIncrementIdentity?: boolean;
  comment?: string | null;
  validate?: Record<string, unknown>;
  field?: string;
  fieldName?: string;
  [key: string]: unknown;
}

/**
 * Minimal interface for a Sequelize DataType instance
 */
export interface SequelizeDataType {
  key?: string;
  constructor?: { key?: string };
  options?: Record<string, unknown>;
  values?: string[]; // for ENUM
  type?: SequelizeDataType; // for ARRAY
  [key: string]: unknown;
}

/**
 * Minimal interface for a Sequelize Model class (static side)
 */
export interface SequelizeModelClass {
  name: string;
  rawAttributes: Record<string, RawAttribute>;
  associations?: Record<string, SequelizeAssociation>;
  options?: Record<string, unknown>;
}

/**
 * Minimal interface for a Sequelize association
 */
export interface SequelizeAssociation {
  associationType: string;
  as: string;
  target: { name: string };
  foreignKey?: string;
  [key: string]: unknown;
}
