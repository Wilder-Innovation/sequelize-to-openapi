/**
 * Basic conversion tests — structure, title, required, defaults, comments
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DataTypes, Model } from 'sequelize';
import s2o from '../src/index.js';
import { sequelize } from './setup.js';

// ─── Model fixtures ───────────────────────────────────────────────────────────

class Cat extends Model {}
class Product extends Model {}
class WithDefaults extends Model {}
class WithComment extends Model {}

beforeAll(() => {
  Cat.init(
    { name: { type: DataTypes.STRING, allowNull: false } },
    { sequelize, modelName: 'Cat' },
  );

  Product.init(
    {
      sku: { type: DataTypes.STRING(32), allowNull: false },
      price: { type: DataTypes.FLOAT, allowNull: false },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, modelName: 'Product' },
  );

  WithDefaults.init(
    {
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
      count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { sequelize, modelName: 'WithDefaults' },
  );

  WithComment.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'The user email address',
      },
    },
    { sequelize, modelName: 'WithComment' },
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('basic conversion', () => {
  it('returns a valid OpenAPI 3.1 schema object', () => {
    const schema = s2o(Cat as any);
    expect(schema).toMatchObject({
      title: 'Cat',
      type: 'object',
      properties: expect.any(Object),
    });
  });

  it('uses model name as title by default', () => {
    const schema = s2o(Cat as any);
    expect(schema.title).toBe('Cat');
  });

  it('includes auto-generated id property', () => {
    const schema = s2o(Cat as any);
    expect(schema.properties).toHaveProperty('id');
    expect(schema.properties.id).toMatchObject({ type: 'integer' });
  });

  it('marks auto-increment id as readOnly', () => {
    const schema = s2o(Cat as any);
    expect(schema.properties.id).toHaveProperty('readOnly', true);
  });

  it('includes createdAt and updatedAt by default', () => {
    const schema = s2o(Cat as any);
    expect(schema.properties).toHaveProperty('createdAt');
    expect(schema.properties).toHaveProperty('updatedAt');
    expect(schema.properties.createdAt).toMatchObject({ type: 'string', format: 'date-time' });
  });

  it('maps allowNull: false (no default) to required', () => {
    const schema = s2o(Cat as any);
    expect(schema.required).toContain('name');
  });

  it('does NOT mark auto-increment id as required', () => {
    const schema = s2o(Cat as any);
    expect(schema.required).not.toContain('id');
  });

  it('does NOT mark fields with defaultValue as required', () => {
    const schema = s2o(WithDefaults as any);
    expect(schema.required).not.toContain('status');
    expect(schema.required).not.toContain('count');
  });

  it('maps defaultValue to OpenAPI default', () => {
    const schema = s2o(WithDefaults as any);
    expect(schema.properties.status).toHaveProperty('default', 'active');
    expect(schema.properties.count).toHaveProperty('default', 0);
  });

  it('maps comment to description', () => {
    const schema = s2o(WithComment as any);
    expect(schema.properties.email).toHaveProperty('description', 'The user email address');
  });

  it('does NOT include required array when includeRequired: false', () => {
    const schema = s2o(Cat as any, { includeRequired: false });
    expect(schema).not.toHaveProperty('required');
  });

  it('title option overrides model name', () => {
    const schema = s2o(Cat as any, { title: 'KittySchema' });
    expect(schema.title).toBe('KittySchema');
  });

  it('converts Product model with multiple fields', () => {
    const schema = s2o(Product as any);
    expect(schema.properties).toHaveProperty('sku');
    expect(schema.properties).toHaveProperty('price');
    expect(schema.properties).toHaveProperty('active');
    expect(schema.properties).toHaveProperty('description');
    expect(schema.required).toContain('sku');
    expect(schema.required).toContain('price');
    expect(schema.required).not.toContain('active'); // has default
    expect(schema.required).not.toContain('description'); // allowNull: true
  });
});
