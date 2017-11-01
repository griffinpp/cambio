'use strict'

import redefine from 'redefine';
import * as co from 'cambio';

// dynamically require some modules that should be in the host project
let fileHelpers = require(`${__dirname}/fileHelper`);

//get the requested connection information that should also be in the host project
let config = require(`${fileHelpers.getConfigFilePath()}${process.env.connection}.js`);

module.exports = redefine.Class({
  constructor: function (options) {
    this.options = options || {};
    if (!options.storageOptions) {
      options.storageOptions = {};
    }
    if (!options.storageOptions.tableName) {
      options.storageOptions.tableName = 'cambio';
    }
  },
  logMigration: function (migrationName){
    let connection = co.getConnection(config);

    return this.createTableIfNotExists(connection)
      .then(() => {
        return connection(this.options.storageOptions.tableName).insert({name: migrationName});
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
  unlogMigration: function (migrationName) {
    let connection = co.getConnection(config);

    return this.createTableIfNotExists(connection)
      .then(() => {
        return connection(this.options.storageOptions.tableName).where({name: migrationName}).del();
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
  executed: function () {
    let connection = co.getConnection(config);

    return this.createTableIfNotExists(connection)
      .then(() => {
        return connection.select('name').from(this.options.storageOptions.tableName);
      })
      .then((rows) => {
        connection.destroy();
        let result = [];
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
  createTableIfNotExists: function (connection) {
    return connection.schema
      .createTableIfNotExists(this.options.storageOptions.tableName, (table) => {
         table.increments('id').primary();
         table.string('name').notNullable();
         table.timestamp('loggedAt');
      });
  }
});
