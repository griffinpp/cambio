'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _index = require('../index');

var _fileHelper = require('./fileHelper');

var fileHelpers = _interopRequireWildcard(_fileHelper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//get the requested connection information that should be in the host project
// eslint-disable-next-line import/no-dynamic-require
var config = require('' + fileHelpers.getConfigFilePath() + process.env.connection + '.js');

// doing it any other way seems to cause Umzug to barf
module.exports = function Storage(options) {
  var _this = this;

  this.options = options || {};
  if (!this.options.storageOptions) {
    this.options.storageOptions = {};
  }
  if (!this.options.storageOptions.tableName) {
    this.options.storageOptions.tableName = 'cambio';
  }
  // eslint is mistaking async for the function name here
  // eslint-disable-next-line space-before-function-paren
  this.logMigration = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(migrationName) {
      var connection, result;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              connection = (0, _index.getConnection)(config);
              _context.prev = 1;
              _context.next = 4;
              return _this.createTableIfNotExists(connection);

            case 4:
              _context.next = 6;
              return connection(_this.options.storageOptions.tableName).insert({ name: migrationName });

            case 6:
              result = _context.sent;

              connection.destroy();
              return _context.abrupt('return', result);

            case 11:
              _context.prev = 11;
              _context.t0 = _context['catch'](1);

              connection.destroy();
              throw _context.t0;

            case 15:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this, [[1, 11]]);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();
  // eslint-disable-next-line space-before-function-paren
  this.unlogMigration = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(migrationName) {
      var connection, result;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              connection = (0, _index.getConnection)(config);
              _context2.prev = 1;
              _context2.next = 4;
              return _this.createTableIfNotExists(connection);

            case 4:
              result = connection(_this.options.storageOptions.tableName).where({ name: migrationName }).del();

              connection.destroy();
              return _context2.abrupt('return', result);

            case 9:
              _context2.prev = 9;
              _context2.t0 = _context2['catch'](1);

              connection.destroy();
              throw _context2.t0;

            case 13:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this, [[1, 9]]);
    }));

    return function (_x2) {
      return _ref2.apply(this, arguments);
    };
  }();
  // eslint-disable-next-line space-before-function-paren
  this.executed = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
    var connection, rows;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            connection = (0, _index.getConnection)(config);
            _context3.prev = 1;
            _context3.next = 4;
            return _this.createTableIfNotExists(connection);

          case 4:
            _context3.next = 6;
            return connection.select('name').from(_this.options.storageOptions.tableName);

          case 6:
            rows = _context3.sent;

            connection.destroy();
            return _context3.abrupt('return', rows.map(function (r) {
              return r.name;
            }));

          case 11:
            _context3.prev = 11;
            _context3.t0 = _context3['catch'](1);

            connection.destroy();
            throw _context3.t0;

          case 15:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this, [[1, 11]]);
  }));
  // eslint-disable-next-line space-before-function-paren
  this.createTableIfNotExists = function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(connection) {
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return connection.schema.createTableIfNotExists(_this.options.storageOptions.tableName, function (table) {
                table.increments('id').primary();
                table.string('name').notNullable();
                table.timestamp('loggedAt');
              });

            case 2:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this);
    }));

    return function (_x3) {
      return _ref4.apply(this, arguments);
    };
  }();
};