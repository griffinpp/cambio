'use strict';

var _redefine = require('redefine');

var _redefine2 = _interopRequireDefault(_redefine);

var _cambio = require('cambio');

var co = _interopRequireWildcard(_cambio);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// dynamically require some modules that should be in the host project
var fileHelpers = require(__dirname + '/fileHelper');

//get the requested connection information that should also be in the host project
var config = require('' + fileHelpers.getConfigFilePath() + process.env.connection + '.js');

module.exports = _redefine2.default.Class({
  constructor: function constructor(options) {
    this.options = options || {};
    if (!options.storageOptions) {
      options.storageOptions = {};
    }
    if (!options.storageOptions.tableName) {
      options.storageOptions.tableName = 'cambio';
    }
  },
  logMigration: function logMigration(migrationName) {
    var _this = this;

    var connection = co.getConnection(config);

    return this.createTableIfNotExists(connection).then(function () {
      return connection(_this.options.storageOptions.tableName).insert({ name: migrationName });
    }).then(function (result) {
      connection.destroy();
      return result;
    }).catch(function (err) {
      connection.destroy();
      throw err;
    });
  },
  unlogMigration: function unlogMigration(migrationName) {
    var _this2 = this;

    var connection = co.getConnection(config);

    return this.createTableIfNotExists(connection).then(function () {
      return connection(_this2.options.storageOptions.tableName).where({ name: migrationName }).del();
    }).then(function (result) {
      connection.destroy();
      return result;
    }).catch(function (err) {
      connection.destroy();
      throw err;
    });
  },
  executed: function executed() {
    var _this3 = this;

    var connection = co.getConnection(config);

    return this.createTableIfNotExists(connection).then(function () {
      return connection.select('name').from(_this3.options.storageOptions.tableName);
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
    return connection.schema.createTableIfNotExists(this.options.storageOptions.tableName, function (table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.timestamp('loggedAt');
    });
  }
});