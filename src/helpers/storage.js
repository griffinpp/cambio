import redefine from 'redefine';
// this file runs in the context of the host package, which has cambio installed
// eslint-disable-next-line
import * as co from 'cambio';

// dynamically require some modules that should be in the host project
// eslint-disable-next-line
const fileHelpers = require(`${__dirname}/fileHelper`);

//get the requested connection information that should also be in the host project
// eslint-disable-next-line
const config = require(`${fileHelpers.getConfigFilePath()}${process.env.connection}.js`);

module.exports = redefine.Class({
  constructor: (options) => {
    this.options = options || {};
    if (!options.storageOptions) {
      // eslint-disable-next-line
      options.storageOptions = {};
    }
    if (!options.storageOptions.tableName) {
      // eslint-disable-next-line
      options.storageOptions.tableName = 'cambio';
    }
  },
  logMigration: (migrationName) => {
    const connection = co.getConnection(config);

    return this.createTableIfNotExists(connection)
      .then(() => {
        return connection(this.options.storageOptions.tableName).insert({ name: migrationName });
      })
      .then((result) => {
        connection.destroy();
        return result;
      })
      .catch((err) => {
        connection.destroy();
        throw err;
      });
  },
  unlogMigration: (migrationName) => {
    const connection = co.getConnection(config);

    return this.createTableIfNotExists(connection)
      .then(() => {
        return connection(this.options.storageOptions.tableName).where({ name: migrationName }).del();
      })
      .then((result) => {
        connection.destroy();
        return result;
      })
      .catch((err) => {
        connection.destroy();
        throw err;
      });
  },
  executed: () => {
    const connection = co.getConnection(config);

    return this.createTableIfNotExists(connection)
      .then(() => {
        return connection.select('name').from(this.options.storageOptions.tableName);
      })
      .then((rows) => {
        connection.destroy();
        const result = [];
        rows.map((row) => {
          result.push(row.name);
        });
        return result;
      })
      .catch((err) => {
        connection.destroy();
        throw err;
      });
  },
  createTableIfNotExists: (connection) => {
    return connection.schema
      .createTableIfNotExists(this.options.storageOptions.tableName, (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.timestamp('loggedAt');
      });
  },
});
