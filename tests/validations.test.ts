/**
 * Validation extraction tests — Sequelize validate:{} → OpenAPI constraints
 */

import { describe, it, expect } from 'vitest';
import { applyValidations } from '../src/index.js';
import type { OpenAPISchemaObject } from '../src/types.js';

function base(): OpenAPISchemaObject {
  return { type: 'string' };
}

describe('applyValidations()', () => {
  // ─── Length ──────────────────────────────────────────────────────────────
  describe('len', () => {
    it('len: [min, max] → minLength + maxLength', () => {
      const schema = applyValidations(base(), { len: [3, 50] });
      expect(schema).toMatchObject({ minLength: 3, maxLength: 50 });
    });

    it('len: [min] → minLength only', () => {
      const schema = applyValidations(base(), { len: [2] });
      expect(schema.minLength).toBe(2);
      expect(schema.maxLength).toBeUndefined();
    });

    it('len: { args: [min, max] } → minLength + maxLength', () => {
      const schema = applyValidations(base(), { len: { args: [1, 100] } });
      expect(schema).toMatchObject({ minLength: 1, maxLength: 100 });
    });

    it('len: [0, max] → maxLength only (min 0 is ignored)', () => {
      const schema = applyValidations(base(), { len: [0, 100] });
      expect(schema.maxLength).toBe(100);
      expect(schema.minLength).toBeUndefined();
    });
  });

  // ─── Numeric bounds ───────────────────────────────────────────────────────
  describe('min / max', () => {
    it('min → minimum', () => {
      const schema = applyValidations({ type: 'number' }, { min: 0 });
      expect(schema.minimum).toBe(0);
    });

    it('max → maximum', () => {
      const schema = applyValidations({ type: 'number' }, { max: 999 });
      expect(schema.maximum).toBe(999);
    });

    it('min + max → minimum + maximum', () => {
      const schema = applyValidations({ type: 'number' }, { min: 1, max: 100 });
      expect(schema).toMatchObject({ minimum: 1, maximum: 100 });
    });

    it('min: { args: 5 } → minimum: 5', () => {
      const schema = applyValidations({ type: 'number' }, { min: { args: 5 } });
      expect(schema.minimum).toBe(5);
    });
  });

  // ─── Format hints ─────────────────────────────────────────────────────────
  describe('format validators', () => {
    it('isEmail: true → format: email', () => {
      const schema = applyValidations(base(), { isEmail: true });
      expect(schema.format).toBe('email');
    });

    it('isEmail: false → no format', () => {
      const schema = applyValidations(base(), { isEmail: false });
      expect(schema.format).toBeUndefined();
    });

    it('isUrl: true → format: uri', () => {
      const schema = applyValidations(base(), { isUrl: true });
      expect(schema.format).toBe('uri');
    });

    it('isURL: true → format: uri', () => {
      const schema = applyValidations(base(), { isURL: true });
      expect(schema.format).toBe('uri');
    });

    it('isUUID: true → format: uuid', () => {
      const schema = applyValidations(base(), { isUUID: true });
      expect(schema.format).toBe('uuid');
    });

    it('isIPv4: true → format: ipv4', () => {
      const schema = applyValidations(base(), { isIPv4: true });
      expect(schema.format).toBe('ipv4');
    });

    it('isIPv6: true → format: ipv6', () => {
      const schema = applyValidations(base(), { isIPv6: true });
      expect(schema.format).toBe('ipv6');
    });
  });

  // ─── Pattern hints ────────────────────────────────────────────────────────
  describe('pattern validators', () => {
    it('isAlpha: true → pattern: ^[a-zA-Z]+$', () => {
      const schema = applyValidations(base(), { isAlpha: true });
      expect(schema.pattern).toBe('^[a-zA-Z]+$');
    });

    it('isAlphanumeric: true → pattern: ^[a-zA-Z0-9]+$', () => {
      const schema = applyValidations(base(), { isAlphanumeric: true });
      expect(schema.pattern).toBe('^[a-zA-Z0-9]+$');
    });

    it('isNumeric: true → pattern: ^[0-9]+$', () => {
      const schema = applyValidations(base(), { isNumeric: true });
      expect(schema.pattern).toBe('^[0-9]+$');
    });

    it('isLowercase: true → pattern: ^[a-z]+$', () => {
      const schema = applyValidations(base(), { isLowercase: true });
      expect(schema.pattern).toBe('^[a-z]+$');
    });

    it('isUppercase: true → pattern: ^[A-Z]+$', () => {
      const schema = applyValidations(base(), { isUppercase: true });
      expect(schema.pattern).toBe('^[A-Z]+$');
    });
  });

  // ─── is / regex ───────────────────────────────────────────────────────────
  describe('is (custom regex)', () => {
    it('is: /pattern/ → pattern: source', () => {
      const schema = applyValidations(base(), { is: /^hello/ });
      expect(schema.pattern).toBe('^hello');
    });

    it("is: ['^pattern$', 'i'] → pattern: ^pattern$", () => {
      const schema = applyValidations(base(), { is: ['^pattern$', 'i'] });
      expect(schema.pattern).toBe('^pattern$');
    });

    it('is: { args: /regex/ } → pattern: source', () => {
      const schema = applyValidations(base(), { is: { args: /^[A-Z]/ } });
      expect(schema.pattern).toBe('^[A-Z]');
    });
  });

  // ─── notEmpty ─────────────────────────────────────────────────────────────
  describe('notEmpty', () => {
    it('notEmpty: true → minLength: 1', () => {
      const schema = applyValidations(base(), { notEmpty: true });
      expect(schema.minLength).toBe(1);
    });

    it('notEmpty: false → no change', () => {
      const schema = applyValidations(base(), { notEmpty: false });
      expect(schema.minLength).toBeUndefined();
    });

    it('notEmpty does not override larger len minLength', () => {
      const schema = applyValidations(base(), { len: [5, 50], notEmpty: true });
      expect(schema.minLength).toBe(5);
    });
  });

  // ─── isIn ─────────────────────────────────────────────────────────────────
  describe('isIn', () => {
    it("isIn: [['a','b','c']] → enum: ['a','b','c']", () => {
      const schema = applyValidations(base(), { isIn: [['a', 'b', 'c']] });
      expect(schema.enum).toEqual(['a', 'b', 'c']);
    });

    it('isIn: { args: [[1,2,3]] } → enum: [1,2,3]', () => {
      const schema = applyValidations(base(), { isIn: { args: [[1, 2, 3]] } });
      expect(schema.enum).toEqual([1, 2, 3]);
    });
  });

  // ─── Multiple rules ───────────────────────────────────────────────────────
  describe('multiple rules combined', () => {
    it('applies multiple rules to the same schema', () => {
      const schema = applyValidations(base(), {
        isEmail: true,
        len: [5, 255],
        notEmpty: true,
      });
      expect(schema.format).toBe('email');
      expect(schema.minLength).toBe(5);
      expect(schema.maxLength).toBe(255);
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('returns schema unchanged for empty validate object', () => {
      const s = base();
      const result = applyValidations(s, {});
      expect(result).toEqual({ type: 'string' });
    });

    it('ignores unknown validation rules', () => {
      const schema = applyValidations(base(), { customValidator: true } as any);
      expect(schema).toEqual({ type: 'string' });
    });

    it('handles null/undefined validate gracefully', () => {
      expect(() => applyValidations(base(), null as any)).not.toThrow();
      expect(() => applyValidations(base(), undefined as any)).not.toThrow();
    });
  });
});

// ─── Integration: validation on model attributes ───────────────────────────

describe('validations via s2o integration', () => {
  it('extracts validations from model rawAttributes', async () => {
    const { DataTypes, Model } = await import('sequelize');
    const { default: s2o } = await import('../src/index.js');
    const { sequelize } = await import('./setup.js');

    class ValidatedUser extends Model {}
    ValidatedUser.init(
      {
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { isEmail: true, len: [5, 254] },
        },
        age: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: { min: 0, max: 150 },
        },
        username: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { isAlphanumeric: true, notEmpty: true, len: [3, 32] },
        },
      },
      { sequelize, modelName: 'ValidatedUser' },
    );

    const schema = s2o(ValidatedUser as any);

    expect(schema.properties.email).toMatchObject({
      type: 'string',
      format: 'email',
      minLength: 5,
      maxLength: 254,
    });

    expect(schema.properties.age).toMatchObject({
      type: 'integer',
      minimum: 0,
      maximum: 150,
    });

    expect(schema.properties.username).toMatchObject({
      type: 'string',
      pattern: '^[a-zA-Z0-9]+$',
      minLength: 3,
      maxLength: 32,
    });
  });
});
