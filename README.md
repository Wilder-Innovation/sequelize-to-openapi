# sequelize-to-openapi

> **Convert Sequelize models to OpenAPI 3.1 schemas automatically**

[![npm version](https://img.shields.io/npm/v/sequelize-to-openapi.svg)](https://www.npmjs.com/package/sequelize-to-openapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js >=16](https://img.shields.io/badge/node-%3E%3D16-brightgreen.svg)](https://nodejs.org)

Define your models once in Sequelize. Derive your API documentation automatically.

`sequelize-to-openapi` is the Sequelize counterpart of the popular [`mongoose-to-swagger`](https://github.com/giddyinc/mongoose-to-swagger) package — but targeting **OpenAPI 3.1** (not Swagger 2.0) and built for modern **Sequelize v6+**.

---

## Table of Contents

- [Why?](#why)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Comparison to mongoose-to-swagger](#comparison-to-mongoose-to-swagger)
- [API Reference](#api-reference)
  - [s2o(Model, options?)](#s2omodel-options)
  - [Options](#options)
- [DataType Mapping](#datatype-mapping)
- [Validation Extraction](#validation-extraction)
- [Express + swagger-ui-express Integration](#express--swagger-ui-express-integration)
- [TypeScript Usage](#typescript-usage)
- [Philosophy](#philosophy)
- [Contributing](#contributing)
- [License](#license)

---

## Why?

When you use Sequelize, you already describe your data model thoroughly: field types, nullability, defaults, validations, and comments. **Your API schema is already there — why write it twice?**

`sequelize-to-openapi` reads your `Model.rawAttributes` and produces a fully-formed OpenAPI 3.1 Schema Object, including:

- All Sequelize DataType → OpenAPI type/format mappings
- Required field detection (based on `allowNull: false` + no `defaultValue`)
- Validation constraints (`validate: {}`) mapped to OpenAPI keywords
- Column `comment` → `description`
- `defaultValue` → `default`
- Auto-increment PKs marked as `readOnly: true`

---

## Installation

```bash
npm install sequelize-to-openapi
# or
yarn add sequelize-to-openapi
# or
pnpm add sequelize-to-openapi
```

`sequelize` is a peer dependency — make sure you have it installed.

---

## Quick Start

```typescript
import s2o from 'sequelize-to-openapi';
import { Sequelize, DataTypes, Model } from 'sequelize';

const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:' });

class User extends Model {}
User.init(
  {
    username: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'The login username',
      validate: { isAlphanumeric: true, notEmpty: true, len: [3, 64] },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'moderator'),
      allowNull: false,
      defaultValue: 'user',
    },
    lastLogin: DataTypes.DATE,
  },
  { sequelize, modelName: 'User' },
);

const schema = s2o(User);
```

Output:

```json
{
  "title": "User",
  "type": "object",
  "properties": {
    "id": { "type": "integer", "format": "int32", "readOnly": true },
    "username": {
      "type": "string",
      "maxLength": 64,
      "description": "The login username",
      "pattern": "^[a-zA-Z0-9]+$",
      "minLength": 3
    },
    "email": { "type": "string", "format": "email" },
    "role": {
      "type": "string",
      "enum": ["admin", "user", "moderator"],
      "default": "user"
    },
    "lastLogin": { "type": "string", "format": "date-time" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "required": ["username", "email", "role"]
}
```

---

## Comparison to mongoose-to-swagger

If you're coming from Mongoose + `mongoose-to-swagger`, the migration is intentional:

| Feature | mongoose-to-swagger | sequelize-to-openapi |
|---|---|---|
| Schema source | Mongoose Model | Sequelize Model |
| Output format | Swagger 2.0 | **OpenAPI 3.1** |
| API | `m2s(Model)` | `s2o(Model)` |
| Options | `omitFields`, `props` | `omitFields`, `props`, `omitSequelizeInternals`, `includeRequired`, `title`, `includeAssociations` |
| Type mapping | Mongoose types | All Sequelize v6 DataTypes |
| Validations | Basic | Full `validate:{}` extraction |
| Zero runtime deps | ✅ | ✅ |
| TypeScript | ✅ | ✅ |

```typescript
// mongoose-to-swagger
const m2s = require('mongoose-to-swagger');
const schema = m2s(MyMongooseModel);

// sequelize-to-openapi — same ergonomics
const s2o = require('sequelize-to-openapi');
const schema = s2o(MySequelizeModel);
```

---

## API Reference

### `s2o(Model, options?)`

```typescript
import s2o from 'sequelize-to-openapi';

const schema = s2o(MyModel, {
  omitFields: ['password', 'secretToken'],
  omitSequelizeInternals: true,
  title: 'PublicUserDTO',
});
```

**Parameters:**
- `Model` — A Sequelize Model class (must be initialized with `.init()`)
- `options` — Optional `Options` object (see below)

**Returns:** An OpenAPI 3.1 Schema Object

---

### Options

```typescript
interface Options {
  /**
   * Fields to exclude from output
   * @example ['password', 'internalNote']
   */
  omitFields?: string[];

  /**
   * Extra model-level attribute props to include in schema properties.
   * Use this to whitelist non-standard metadata props you've added to
   * your attribute definitions (e.g. 'description', 'example').
   * @example ['description', 'example']
   */
  props?: string[];

  /**
   * Whether to omit Sequelize-managed fields: id, createdAt, updatedAt, deletedAt
   * @default false
   */
  omitSequelizeInternals?: boolean;

  /**
   * Whether to include the 'required' array
   * @default true
   */
  includeRequired?: boolean;

  /**
   * Title override (default: model class name)
   */
  title?: string;

  /**
   * Whether to include association references as $ref / array schemas
   * @default false
   */
  includeAssociations?: boolean;
}
```

---

## DataType Mapping

All Sequelize v6 DataTypes are supported:

| Sequelize DataType | OpenAPI 3.1 |
|---|---|
| `STRING` | `{ type: 'string' }` |
| `STRING(n)` | `{ type: 'string', maxLength: n }` |
| `CHAR(n)` | `{ type: 'string', minLength: n, maxLength: n }` |
| `TEXT` / `TEXT('tiny')` | `{ type: 'string' }` |
| `CITEXT` | `{ type: 'string' }` |
| `INTEGER` | `{ type: 'integer', format: 'int32' }` |
| `SMALLINT` / `TINYINT` / `MEDIUMINT` | `{ type: 'integer', format: 'int32' }` |
| `BIGINT` | `{ type: 'integer', format: 'int64' }` |
| `FLOAT` / `REAL` | `{ type: 'number', format: 'float' }` |
| `DOUBLE` | `{ type: 'number', format: 'double' }` |
| `DECIMAL` / `DECIMAL(p, s)` | `{ type: 'number' }` |
| `BOOLEAN` | `{ type: 'boolean' }` |
| `DATE` | `{ type: 'string', format: 'date-time' }` |
| `DATEONLY` | `{ type: 'string', format: 'date' }` |
| `TIME` | `{ type: 'string', format: 'time' }` |
| `UUID` / `UUIDV1` / `UUIDV4` | `{ type: 'string', format: 'uuid' }` |
| `ENUM('a', 'b')` | `{ type: 'string', enum: ['a', 'b'] }` |
| `ARRAY(T)` *(PostgreSQL)* | `{ type: 'array', items: <mapped T> }` |
| `RANGE(T)` *(PostgreSQL)* | `{ type: 'array', items: <mapped T>, minItems: 2, maxItems: 2 }` |
| `JSON` / `JSONB` | `{ type: 'object' }` |
| `BLOB` | `{ type: 'string', format: 'binary' }` |
| `HSTORE` *(PostgreSQL)* | `{ type: 'object' }` |
| `GEOMETRY` / `GEOGRAPHY` | `{ type: 'object' }` |
| `INET` / `CIDR` / `MACADDR` | `{ type: 'string' }` |
| `VIRTUAL` | *(skipped)* |

---

## Validation Extraction

Sequelize's `validate: {}` block is automatically extracted and mapped to OpenAPI constraint keywords:

| Sequelize validate rule | OpenAPI constraint |
|---|---|
| `len: [min, max]` | `minLength`, `maxLength` |
| `min: n` | `minimum: n` |
| `max: n` | `maximum: n` |
| `isEmail: true` | `format: 'email'` |
| `isUrl: true` / `isURL: true` | `format: 'uri'` |
| `isUUID: true` | `format: 'uuid'` |
| `isAlpha: true` | `pattern: '^[a-zA-Z]+$'` |
| `isAlphanumeric: true` | `pattern: '^[a-zA-Z0-9]+$'` |
| `isNumeric: true` | `pattern: '^[0-9]+$'` |
| `isLowercase: true` | `pattern: '^[a-z]+$'` |
| `isUppercase: true` | `pattern: '^[A-Z]+$'` |
| `notEmpty: true` | `minLength: 1` |
| `isIn: [[values]]` | `enum: values` |
| `isIPv4: true` | `format: 'ipv4'` |
| `isIPv6: true` | `format: 'ipv6'` |
| `is: /regex/` | `pattern: 'regex source'` |

**Example:**

```typescript
class BlogPost extends Model {}
BlogPost.init(
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [10, 120],
        notEmpty: true,
      },
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[a-z0-9-]+$/,
        len: [3, 80],
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['draft', 'published', 'archived']],
      },
    },
  },
  { sequelize, modelName: 'BlogPost' },
);

const schema = s2o(BlogPost);
// properties.title  → { type: 'string', minLength: 10, maxLength: 120 }
// properties.slug   → { type: 'string', pattern: '^[a-z0-9-]+$', minLength: 3, maxLength: 80 }
// properties.status → { type: 'string', enum: ['draft', 'published', 'archived'] }
```

---

## Express + swagger-ui-express Integration

```typescript
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import s2o from 'sequelize-to-openapi';
import { User, Post, Comment } from './models';

const app = express();

// Build the OpenAPI document from your Sequelize models
const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'Auto-generated from Sequelize models',
  },
  components: {
    schemas: {
      User: s2o(User, { omitFields: ['password', 'resetToken'] }),
      Post: s2o(Post),
      Comment: s2o(Comment, { omitSequelizeInternals: true }),
    },
  },
  paths: {
    '/users/{id}': {
      get: {
        operationId: 'getUser',
        summary: 'Get a user by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'The user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.listen(3000, () => {
  console.log('API docs available at http://localhost:3000/api-docs');
});
```

---

## TypeScript Usage

The library is written in TypeScript and ships full type declarations:

```typescript
import s2o, { Options, ModelSchemaObject, OpenAPISchemaObject } from 'sequelize-to-openapi';

const options: Options = {
  omitFields: ['password'],
  omitSequelizeInternals: true,
};

const schema: ModelSchemaObject = s2o(User, options);

// Low-level access
import { mapDataType, applyValidations } from 'sequelize-to-openapi';

const typeSchema: OpenAPISchemaObject | null = mapDataType(DataTypes.STRING(100));
// => { type: 'string', maxLength: 100 }

const withConstraints: OpenAPISchemaObject = applyValidations(
  { type: 'string' },
  { isEmail: true, len: [5, 254] }
);
// => { type: 'string', format: 'email', minLength: 5, maxLength: 254 }
```

---

## Adding Custom Metadata via `props`

If you annotate your attribute definitions with non-standard props (a common pattern for docs-first teams), use the `props` whitelist to include them in the output:

```typescript
class Product extends Model {}
Product.init(
  {
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      // Non-standard OpenAPI metadata — add anything you want
      description: 'Price in USD',
      example: 9.99,
    },
  },
  { sequelize, modelName: 'Product' },
);

const schema = s2o(Product, { props: ['description', 'example'] });
// properties.price → { type: 'number', description: 'Price in USD', example: 9.99 }
```

---

## Philosophy

**Zero runtime dependencies.** This library does pure data transformation — reading from `Model.rawAttributes` and producing a plain JavaScript object. No extra packages needed.

**Colocation.** Your data model and your API schema are the same thing. Define it once in Sequelize and let the documentation derive from it automatically.

**Familiar API.** If you've used `mongoose-to-swagger`, you can switch with minimal changes. The function signature and option names are intentionally compatible.

**Correctness over completeness.** Where a precise mapping isn't possible (e.g. Sequelize `VIRTUAL` fields), we skip rather than guess.

---

## Contributing

Contributions, issues and feature requests are welcome!

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on how to get started.

---

## License

[MIT](./LICENSE) © sequelize-to-openapi contributors

---

*Inspired by [`mongoose-to-swagger`](https://github.com/giddyinc/mongoose-to-swagger) by [Ben Lugavere / giddyinc](https://github.com/giddyinc). Thank you for the original idea.*
