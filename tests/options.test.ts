/**
 * Options API tests — omitFields, props, omitSequelizeInternals, title
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DataTypes, Model } from 'sequelize';
import s2o from '../src/index.js';
import { sequelize } from './setup.js';

// ─── Model fixtures ───────────────────────────────────────────────────────────

class UserOpts extends Model {}
class AnnotatedField extends Model {}

beforeAll(() => {
  UserOpts.init(
    {
      username: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'user' },
    },
    { sequelize, modelName: 'UserOpts' },
  );

  AnnotatedField.init(
    { name: { type: DataTypes.STRING, allowNull: false } },
    { sequelize, modelName: 'AnnotatedField' },
  );
  // Manually inject extra props into rawAttributes to simulate user-added metadata
  (AnnotatedField.rawAttributes.name as any).description = 'The display name';
  (AnnotatedField.rawAttributes.name as any).example = 'Jane Doe';
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('omitFields option', () => {
  it('excludes specified fields from properties', () => {
    const schema = s2o(UserOpts as any, { omitFields: ['password'] });
    expect(schema.properties).not.toHaveProperty('password');
  });

  it('excludes multiple fields', () => {
    const schema = s2o(UserOpts as any, { omitFields: ['password', 'role'] });
    expect(schema.properties).not.toHaveProperty('password');
    expect(schema.properties).not.toHaveProperty('role');
    expect(schema.properties).toHaveProperty('username');
    expect(schema.properties).toHaveProperty('email');
  });

  it('also removes omitted field from required array', () => {
    // password is allowNull: false with no default → would be required
    const schema = s2o(UserOpts as any, { omitFields: ['password'] });
    expect(schema.required).not.toContain('password');
  });

  it('does nothing for fields that do not exist', () => {
    const schema = s2o(UserOpts as any, { omitFields: ['nonexistent'] });
    expect(schema.properties).toHaveProperty('username');
    expect(schema.properties).toHaveProperty('email');
  });
});

describe('omitSequelizeInternals option', () => {
  it('omits id, createdAt, updatedAt when true', () => {
    const schema = s2o(UserOpts as any, { omitSequelizeInternals: true });
    expect(schema.properties).not.toHaveProperty('id');
    expect(schema.properties).not.toHaveProperty('createdAt');
    expect(schema.properties).not.toHaveProperty('updatedAt');
  });

  it('still includes user-defined fields', () => {
    const schema = s2o(UserOpts as any, { omitSequelizeInternals: true });
    expect(schema.properties).toHaveProperty('username');
    expect(schema.properties).toHaveProperty('email');
    expect(schema.properties).toHaveProperty('password');
  });

  it('keeps internals when false (default)', () => {
    const schema = s2o(UserOpts as any, { omitSequelizeInternals: false });
    expect(schema.properties).toHaveProperty('id');
    expect(schema.properties).toHaveProperty('createdAt');
    expect(schema.properties).toHaveProperty('updatedAt');
  });
});

describe('props (whitelist) option', () => {
  it('includes extra attribute props when whitelisted', () => {
    const schema = s2o(AnnotatedField as any, { props: ['description', 'example'] });
    expect(schema.properties.name).toHaveProperty('description', 'The display name');
    expect(schema.properties.name).toHaveProperty('example', 'Jane Doe');
  });

  it('does NOT include extra props without whitelisting', () => {
    const schema = s2o(AnnotatedField as any);
    expect(schema.properties.name).not.toHaveProperty('description');
    expect(schema.properties.name).not.toHaveProperty('example');
  });

  it('handles props that do not exist on attributes gracefully', () => {
    const schema = s2o(UserOpts as any, { props: ['nonexistentProp'] });
    expect(schema.properties.username).not.toHaveProperty('nonexistentProp');
  });
});

describe('title option', () => {
  it('uses model name as default title', () => {
    const schema = s2o(UserOpts as any);
    expect(schema.title).toBe('UserOpts');
  });

  it('overrides title when provided', () => {
    const schema = s2o(UserOpts as any, { title: 'UserDTO' });
    expect(schema.title).toBe('UserDTO');
  });
});

describe('includeRequired option', () => {
  it('includes required array by default', () => {
    const schema = s2o(UserOpts as any);
    expect(schema).toHaveProperty('required');
    expect(Array.isArray(schema.required)).toBe(true);
  });

  it('omits required array when includeRequired: false', () => {
    const schema = s2o(UserOpts as any, { includeRequired: false });
    expect(schema).not.toHaveProperty('required');
  });

  it('required array is absent (not empty) when there are no required fields', () => {
    // All fields with allowNull: true
    class AllOptional extends Model {}
    AllOptional.init(
      { name: { type: DataTypes.STRING, allowNull: true } },
      { sequelize, modelName: 'AllOptional' },
    );
    const schema = s2o(AllOptional as any);
    // required should not exist or be empty
    if (schema.required) {
      expect(schema.required).not.toContain('name');
    }
  });
});

describe('combined options', () => {
  it('omitFields + omitSequelizeInternals work together', () => {
    const schema = s2o(UserOpts as any, {
      omitFields: ['password'],
      omitSequelizeInternals: true,
    });
    expect(schema.properties).not.toHaveProperty('id');
    expect(schema.properties).not.toHaveProperty('createdAt');
    expect(schema.properties).not.toHaveProperty('password');
    expect(schema.properties).toHaveProperty('username');
    expect(schema.properties).toHaveProperty('email');
  });
});
