/**
 * sequelize-to-openapi
 *
 * Convert Sequelize v6 models to OpenAPI 3.1 schema objects automatically.
 *
 * Inspired by mongoose-to-swagger (https://github.com/giddyinc/mongoose-to-swagger)
 * but targeting OpenAPI 3.1 and Sequelize v6+.
 *
 * @example
 * ```typescript
 * import s2o from 'sequelize-to-openapi';
 * import { Model, DataTypes } from 'sequelize';
 *
 * class User extends Model {}
 * User.init({
 *   name: DataTypes.STRING,
 *   email: { type: DataTypes.STRING, allowNull: false },
 * }, { sequelize });
 *
 * const schema = s2o(User);
 * // => {
 * //   title: 'User',
 * //   type: 'object',
 * //   properties: { ... },
 * //   required: ['email'],
 * // }
 * ```
 */

import { convert } from './convert.js';
import type {
  ModelSchemaObject,
  OpenAPISchemaObject,
  Options,
  SequelizeModelClass,
} from './types.js';

export type { ModelSchemaObject, OpenAPISchemaObject, Options, SequelizeModelClass };
export { mapDataType } from './datatypes.js';
export { applyValidations } from './validations.js';
export { convert };

/**
 * Converts a Sequelize Model class to an OpenAPI 3.1 Schema Object.
 *
 * @param Model  - A Sequelize Model class (must have been initialized with .init())
 * @param options - Conversion options
 * @returns An OpenAPI 3.1 Schema Object
 */
function sequelizeToOpenapi(Model: SequelizeModelClass, options?: Options): ModelSchemaObject {
  return convert(Model, options);
}

export default sequelizeToOpenapi;

// CommonJS compat — allows `const s2o = require('sequelize-to-openapi')`
// The default export IS the function, so module.exports = sequelizeToOpenapi
// will be handled by tsup's `format: ['cjs', 'esm']` with `cjsInterop: true`.
