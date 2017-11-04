'use strict';

var _redefine = require('redefine');

var _redefine2 = _interopRequireDefault(_redefine);

var _cambio = require('cambio');

var co = _interopRequireWildcard(_cambio);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// dynamically require some modules that should be in the host project
// eslint-disable-next-line
var fileHelpers = require(__dirname + '/fileHelper');

//get the requested connection information that should also be in the host project
// eslint-disable-next-line

// this file runs in the context of the host package, which has cambio installed
// eslint-disable-next-line
var config = require('' + fileHelpers.getConfigFilePath() + process.env.connection + '.js');

module.exports = _redefine2.default.Class({
  constructor: function constructor(options) {
    undefined.options = options || {};
    if (!options.storageOptions) {
      // eslint-disable-next-line
      options.storageOptions = {};
    }
    if (!options.storageOptions.tableName) {
      // eslint-disable-next-line
      options.storageOptions.tableName = 'cambio';
    }
  },
  logMigration: function logMigration(migrationName) {
    var connection = co.getConnection(config);

    return undefined.createTableIfNotExists(connection).then(function () {
      return connection(undefined.options.storageOptions.tableName).insert({ name: migrationName });
    }).then(function (result) {
      connection.destroy();
      return result;
    }).catch(function (err) {
      connection.destroy();
      throw err;
    });
  },
  unlogMigration: function unlogMigration(migrationName) {
    var connection = co.getConnection(config);

    return undefined.createTableIfNotExists(connection).then(function () {
      return connection(undefined.options.storageOptions.tableName).where({ name: migrationName }).del();
    }).then(function (result) {
      connection.destroy();
      return result;
    }).catch(function (err) {
      connection.destroy();
      throw err;
    });
  },
  executed: function executed() {
    var connection = co.getConnection(config);

    return undefined.createTableIfNotExists(connection).then(function () {
      return connection.select('name').from(undefined.options.storageOptions.tableName);
    }).then(function (rows) {
      connection.destroy();
      var result = [];
      rows.map(function (row) {
        result.push(row.name);
      });
      return result;
    }).catch(function (err) {
      connection.destroy();
      throw err;
    });
  },
  createTableIfNotExists: function createTableIfNotExists(connection) {
    return connection.schema.createTableIfNotExists(undefined.options.storageOptions.tableName, function (table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.timestamp('loggedAt');
    });
  }
});