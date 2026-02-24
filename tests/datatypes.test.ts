/**
 * DataType mapping tests — all Sequelize v6 DataTypes
 */

import { describe, it, expect } from 'vitest';
import { DataTypes, Model } from 'sequelize';
import s2o from '../src/index.js';
import { mapDataType } from '../src/index.js';
import { sequelize } from './setup.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Create a minimal model with a single `value` field of the given DataType,
 * run s2o on it, and return the schema for `value`.
 */
let _counter = 0;
function makeModelSchema(dataType: unknown) {
  const name = `DtTest${++_counter}`;
  class Tmp extends Model {}
  Tmp.init(
    { value: { type: dataType as any, allowNull: true } },
    { sequelize, modelName: name },
  );
  const schema = s2o(Tmp as any);
  return schema.properties['value'];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DataType mapping', () => {
  // ── String ────────────────────────────────────────────────────────────────
  it('STRING → { type: string }', () => {
    expect(makeModelSchema(DataTypes.STRING)).toMatchObject({ type: 'string' });
  });

  it('STRING(n) → { type: string, maxLength: n }', () => {
    expect(makeModelSchema(DataTypes.STRING(64))).toMatchObject({
      type: 'string',
      maxLength: 64,
    });
  });

  it('TEXT → { type: string }', () => {
    expect(makeModelSchema(DataTypes.TEXT)).toMatchObject({ type: 'string' });
  });

  it("TEXT('tiny') → { type: string }", () => {
    expect(makeModelSchema(DataTypes.TEXT('tiny'))).toMatchObject({ type: 'string' });
  });

  it('CITEXT → { type: string }', () => {
    if ((DataTypes as any).CITEXT) {
      expect(makeModelSchema((DataTypes as any).CITEXT)).toMatchObject({ type: 'string' });
    }
  });

  // ── Integer ───────────────────────────────────────────────────────────────
  it('INTEGER → { type: integer, format: int32 }', () => {
    expect(makeModelSchema(DataTypes.INTEGER)).toMatchObject({
      type: 'integer',
      format: 'int32',
    });
  });

  it('BIGINT → { type: integer, format: int64 }', () => {
    expect(makeModelSchema(DataTypes.BIGINT)).toMatchObject({
      type: 'integer',
      format: 'int64',
    });
  });

  it('SMALLINT → { type: integer, format: int32 }', () => {
    expect(makeModelSchema(DataTypes.SMALLINT)).toMatchObject({
      type: 'integer',
      format: 'int32',
    });
  });

  // ── Float / Double / Decimal ──────────────────────────────────────────────
  it('FLOAT → { type: number, format: float }', () => {
    expect(makeModelSchema(DataTypes.FLOAT)).toMatchObject({
      type: 'number',
      format: 'float',
    });
  });

  it('DOUBLE → { type: number, format: double }', () => {
    expect(makeModelSchema(DataTypes.DOUBLE)).toMatchObject({
      type: 'number',
      format: 'double',
    });
  });

  it('REAL → { type: number, format: float }', () => {
    expect(makeModelSchema(DataTypes.REAL)).toMatchObject({
      type: 'number',
      format: 'float',
    });
  });

  it('DECIMAL → { type: number }', () => {
    expect(makeModelSchema(DataTypes.DECIMAL)).toMatchObject({ type: 'number' });
  });

  it('DECIMAL(10, 2) → { type: number }', () => {
    expect(makeModelSchema(DataTypes.DECIMAL(10, 2))).toMatchObject({ type: 'number' });
  });

  // ── Boolean ───────────────────────────────────────────────────────────────
  it('BOOLEAN → { type: boolean }', () => {
    expect(makeModelSchema(DataTypes.BOOLEAN)).toMatchObject({ type: 'boolean' });
  });

  // ── Temporal ─────────────────────────────────────────────────────────────
  it('DATE → { type: string, format: date-time }', () => {
    expect(makeModelSchema(DataTypes.DATE)).toMatchObject({
      type: 'string',
      format: 'date-time',
    });
  });

  it('DATEONLY → { type: string, format: date }', () => {
    expect(makeModelSchema(DataTypes.DATEONLY)).toMatchObject({
      type: 'string',
      format: 'date',
    });
  });

  it('TIME → { type: string, format: time }', () => {
    expect(makeModelSchema(DataTypes.TIME)).toMatchObject({
      type: 'string',
      format: 'time',
    });
  });

  // ── UUID ──────────────────────────────────────────────────────────────────
  it('UUID → { type: string, format: uuid }', () => {
    expect(makeModelSchema(DataTypes.UUID)).toMatchObject({
      type: 'string',
      format: 'uuid',
    });
  });

  it('UUIDV4 → { type: string, format: uuid }', () => {
    expect(makeModelSchema(DataTypes.UUIDV4)).toMatchObject({
      type: 'string',
      format: 'uuid',
    });
  });

  it('UUIDV1 → { type: string, format: uuid }', () => {
    expect(makeModelSchema(DataTypes.UUIDV1)).toMatchObject({
      type: 'string',
      format: 'uuid',
    });
  });

  // ── ENUM ──────────────────────────────────────────────────────────────────
  it("ENUM('a','b','c') → { type: string, enum: ['a','b','c'] }", () => {
    expect(makeModelSchema(DataTypes.ENUM('a', 'b', 'c'))).toMatchObject({
      type: 'string',
      enum: ['a', 'b', 'c'],
    });
  });

  // ── JSON ──────────────────────────────────────────────────────────────────
  it('JSON → { type: object }', () => {
    expect(makeModelSchema(DataTypes.JSON)).toMatchObject({ type: 'object' });
  });

  it('JSONB → { type: object }', () => {
    expect(makeModelSchema(DataTypes.JSONB)).toMatchObject({ type: 'object' });
  });

  // ── Binary ────────────────────────────────────────────────────────────────
  it('BLOB → { type: string, format: binary }', () => {
    expect(makeModelSchema(DataTypes.BLOB)).toMatchObject({
      type: 'string',
      format: 'binary',
    });
  });

  // ── Array ─────────────────────────────────────────────────────────────────
  it('ARRAY(INTEGER) → { type: array, items: { type: integer } }', () => {
    // ARRAY is PostgreSQL-only; mapDataType can still be tested directly
    const arrayType = DataTypes.ARRAY(DataTypes.INTEGER);
    const result = mapDataType(arrayType as any);
    expect(result).toMatchObject({
      type: 'array',
      items: { type: 'integer', format: 'int32' },
    });
  });

  it('ARRAY(STRING) → { type: array, items: { type: string } }', () => {
    const arrayType = DataTypes.ARRAY(DataTypes.STRING);
    const result = mapDataType(arrayType as any);
    expect(result).toMatchObject({
      type: 'array',
      items: { type: 'string' },
    });
  });

  // ── Virtual ───────────────────────────────────────────────────────────────
  it('VIRTUAL fields are excluded from properties', () => {
    const name = `VirtualTest${++_counter}`;
    class Tmp extends Model {}
    Tmp.init(
      {
        real: { type: DataTypes.STRING, allowNull: true },
        computed: { type: DataTypes.VIRTUAL, allowNull: true },
      },
      { sequelize, modelName: name },
    );
    const schema = s2o(Tmp as any);
    expect(schema.properties).toHaveProperty('real');
    expect(schema.properties).not.toHaveProperty('computed');
  });

  // ── mapDataType unit tests ─────────────────────────────────────────────────
  describe('mapDataType() unit tests', () => {
    it('returns null for VIRTUAL', () => {
      expect(mapDataType(DataTypes.VIRTUAL as any)).toBeNull();
    });

    it('maps STRING correctly', () => {
      expect(mapDataType(DataTypes.STRING as any)).toMatchObject({ type: 'string' });
    });

    it('maps BOOLEAN correctly', () => {
      expect(mapDataType(DataTypes.BOOLEAN as any)).toMatchObject({ type: 'boolean' });
    });
  });
});
