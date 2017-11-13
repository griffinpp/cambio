'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// doing it any other way seems to cause Umzug to barf
module.exports = function Storage(options) {
  var _this = this;

  this.options = options || {};
  if (!this.options.storageOptions || !this.options.storageOptions.connection) {
    throw new Error('no connection provided');
  }
  if (!this.options.storageOptions.tableName) {
    this.options.storageOptions.tableName = 'cambio';
  }
  // eslint is mistaking async for the function name here
  // eslint-disable-next-line space-before-function-paren
  this.logMigration = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(migrationName) {
      var result;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _this.createTableIfNotExists();

            case 2:
              _context.next = 4;
              return _this.options.storageOptions.connection(_this.options.storageOptions.tableName).insert({ name: migrationName });

            case 4:
              result = _context.sent;
              return _context.abrupt('return', result);

            case 6:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();
  // eslint-disable-next-line space-before-function-paren
  this.unlogMigration = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(migrationName) {
      var result;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return _this.createTableIfNotExists();

            case 2:
              _context2.next = 4;
              return _this.options.storageOptions.connection(_this.options.storageOptions.tableName).where({ name: migrationName }).del();

            case 4:
              result = _context2.sent;
              return _context2.abrupt('return', result);

            case 6:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }));

    return function (_x2) {
      return _ref2.apply(this, arguments);
    };
  }();
  // eslint-disable-next-line space-before-function-paren
  this.executed = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
    var rows;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return _this.createTableIfNotExists();

          case 2:
            _context3.next = 4;
            return _this.options.storageOptions.connection.select('name').from(_this.options.storageOptions.tableName);

          case 4:
            rows = _context3.sent;
            return _context3.abrupt('return', rows.map(function (r) {
              return r.name;
            }));

          case 6:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this);
  }));
  // eslint-disable-next-line space-before-function-paren
  this.createTableIfNotExists = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return _this.options.storageOptions.connection.schema.createTableIfNotExists(_this.options.storageOptions.tableName, function (table) {
              table.increments('id').primary();
              table.string('name').notNullable();
              table.timestamp('loggedAt');
            }).createTableIfNotExists('cambioLock', function (table) {
              table.boolean('lock').defaultTo(true);
              table.timestamp('lockedAt').defaultTo(_this.options.storageOptions.connection.fn.now());
            });

          case 2:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this);
  }));
};