import { getConnection } from '../index';
import * as fileHelpers from './fileHelper';

//get the requested connection information that should be in the host project
// eslint-disable-next-line import/no-dynamic-require
const config = require(`${fileHelpers.getConfigFilePath()}${process.env.connection}.js`);

// doing it any other way seems to cause Umzug to barf
module.exports = function Storage(options) {
  this.options = options || {};
  if (!this.options.storageOptions) {
    this.options.storageOptions = {};
  }
  if (!this.options.storageOptions.tableName) {
    this.options.storageOptions.tableName = 'cambio';
  }
  // eslint is mistaking async for the function name here
  // eslint-disable-next-line space-before-function-paren
  this.logMigration = async (migrationName) => {
    const connection = getConnection(config);
    try {
      await this.createTableIfNotExists(connection);
      const result = await connection(this.options.storageOptions.tableName).insert({ name: migrationName });
      connection.destroy();
      return result;
    } catch (e) {
      connection.destroy();
      throw e;
    }
  };
  // eslint-disable-next-line space-before-function-paren
  this.unlogMigration = async (migrationName) => {
    const connection = getConnection(config);
    try {
      await this.createTableIfNotExists(connection);
      const result = connection(this.options.storageOptions.tableName).where({ name: migrationName }).del();
      connection.destroy();
      return result;
    } catch (e) {
      connection.destroy();
      throw e;
    }
  };
  // eslint-disable-next-line space-before-function-paren
  this.executed = async () => {
    const connection = getConnection(config);
    try {
      await this.createTableIfNotExists(connection);
      const rows = await connection.select('name').from(this.options.storageOptions.tableName);
      connection.destroy();
      return rows.map((r) => {
        return r.name;
      });
    } catch (e) {
      connection.destroy();
      throw e;
    }
  };
  // eslint-disable-next-line space-before-function-paren
  this.createTableIfNotExists = async (connection) => {
    await connection.schema
      .createTableIfNotExists(this.options.storageOptions.tableName, (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.timestamp('loggedAt');
      });
  };
};
