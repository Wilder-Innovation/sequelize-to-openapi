/**
 * sequelize-to-openapi — Basic Usage Example
 *
 * Run with: node examples/basic.js
 * (Requires sequelize and better-sqlite3 to be installed as dev deps)
 */

'use strict';

const { Sequelize, DataTypes, Model } = require('sequelize');

// We require from src via ts-node in the example runner, or from dist/ after build.
// For demonstration purposes, we load source directly via ts-node/esm if available.
let s2o;
try {
  // After build
  s2o = require('../dist/cjs/index.cjs');
  if (typeof s2o !== 'function') s2o = s2o.default;
} catch {
  console.error('Please run `npm run build` first, or use ts-node to run TypeScript directly.');
  process.exit(1);
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });

// ─── Define a Sequelize Model ─────────────────────────────────────────────────

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
      comment: 'The user email address',
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'moderator'),
      allowNull: false,
      defaultValue: 'user',
      comment: 'User permission role',
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0, max: 150 },
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  { sequelize, modelName: 'User' },
);

// ─── Convert to OpenAPI 3.1 Schema ────────────────────────────────────────────

console.log('\n=== Full Schema ===');
const fullSchema = s2o(User);
console.log(JSON.stringify(fullSchema, null, 2));

console.log('\n=== Omit password + internals ===');
const publicSchema = s2o(User, {
  omitFields: ['password'],
  omitSequelizeInternals: true,
  title: 'PublicUserDTO',
});
console.log(JSON.stringify(publicSchema, null, 2));

console.log('\n=== No required array ===');
const noRequiredSchema = s2o(User, { includeRequired: false });
console.log(JSON.stringify(noRequiredSchema, null, 2));

// ─── Integration example: Express + swagger-ui-express ────────────────────────

console.log(`
=== Express Integration Example ===

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const s2o = require('sequelize-to-openapi');
const { User } = require('./models/user');

const app = express();

const openApiDoc = {
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
  components: {
    schemas: {
      User: s2o(User, { omitFields: ['password'] }),
    },
  },
  paths: {
    '/users': {
      get: {
        summary: 'List users',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
    },
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));
app.listen(3000, () => console.log('API docs at http://localhost:3000/api-docs'));
`);
