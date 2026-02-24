/**
 * Shared test setup: creates an in-memory SQLite Sequelize instance.
 */
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
});
