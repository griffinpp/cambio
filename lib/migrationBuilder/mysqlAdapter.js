'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var getMySqlTableNames = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(connection) {
    var result, columnName;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return connection.raw('show tables');

          case 2:
            result = _context2.sent;
            columnName = result[1][0].name;
            return _context2.abrupt('return', result[0].map(function (t) {
              return t[columnName];
            }));

          case 5:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getMySqlTableNames(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var getMySqlTableInformation = function () {
  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(connection, dbName, tableName) {
    var rawColumnInfo, rawConstraints;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return connection.raw('describe ' + tableName);

          case 2:
            rawColumnInfo = _context3.sent;
            _context3.next = 5;
            return connection.raw('select * from information_schema.key_column_usage where TABLE_SCHEMA = \'' + dbName + '\' and TABLE_NAME = \'' + tableName + '\';');

          case 5:
            rawConstraints = _context3.sent;
            return _context3.abrupt('return', {
              name: tableName,
              columns: rawColumnInfo[0].map(function (column) {
                var constraints = rawConstraints[0].filter(function (c) {
                  return c.COLUMN_NAME === column.Field;
                });
                return {
                  name: column.Field,
                  rawType: column.Type,
                  knexType: mySqlParseType(column.Type, column.Extra),
                  notNullable: column.Null === 'NO',
                  unsigned: checkUnsigned(column.Type),
                  // TODO
                  unique: false,
                  default: column.Default,
                  primary: constraints.some(function (c) {
                    return c.CONSTRAINT_NAME === 'primary';
                  }),
                  foreignKey: mysqlGetForeignKey(constraints)
                };
              }),
              // TODO
              indexes: {}
            });

          case 7:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function getMySqlTableInformation(_x3, _x4, _x5) {
    return _ref3.apply(this, arguments);
  };
}();

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(config) {
    var connection, tableNames, tables, i, tableInfo;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // TODO not sure if this is how I want to get the connection...
            connection = (0, _knex2.default)(config);
            _context.prev = 1;
            _context.next = 4;
            return getMySqlTableNames(connection);

          case 4:
            tableNames = _context.sent;
            tables = [];
            i = 0;

          case 7:
            if (!(i < tableNames.length)) {
              _context.next = 15;
              break;
            }

            _context.next = 10;
            return getMySqlTableInformation(connection, config.connection.database, tableNames[i]);

          case 10:
            tableInfo = _context.sent;

            tables.push(tableInfo);

          case 12:
            i++;
            _context.next = 7;
            break;

          case 15:
            connection.destroy();
            return _context.abrupt('return', tables);

          case 19:
            _context.prev = 19;
            _context.t0 = _context['catch'](1);

            console.log(_context.t0.stack);
            connection.destroy();
            throw _context.t0;

          case 24:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[1, 19]]);
  }));

  function getSchema(_x) {
    return _ref.apply(this, arguments);
  }

  return getSchema;
}();

function mySqlParseType(rawType, extra) {
  /* Possible types in knex:
    – increments
    – integer
    – bigInteger
    – text
    – string
    – float
    – decimal
    – boolean
    – date
    – dateTime
    – time
    – timestamp
    – timestamps
    – binary
    – enum / enu
    – json
    – jsonb
    - uuid
    - specificType - for everything else
  */

  // first check if this is an auto-increment column
  if (extra !== null && extra.toLowerCase() === 'auto_increment') {
    return {
      type: 'increments',
      params: null
    };
  }
  var baseType = /[a-z]*/.exec(rawType)[0].toLowerCase();
  switch (baseType) {
    case 'int':
    case 'integer':
      return {
        type: 'integer',
        params: parseParameters(rawType)
      };
    case 'bigint':
      return {
        type: 'bigInteger',
        params: parseParameters(rawType)
      };
    case 'varchar':
      return {
        type: 'string',
        params: parseParameters(rawType)
      };
    case 'char':
      if (rawType.indexOf('(36)') !== -1) {
        return {
          type: 'uuid',
          params: null
        };
      }
      return {
        type: 'specificType',
        params: convertRawToParams(rawType)
      };
    case 'tinyint':
      if (rawType.indexOf('(1)') !== -1) {
        return {
          type: 'boolean',
          params: null
        };
      }
      return {
        type: 'integer',
        params: parseParameters(rawType)
      };
    case 'bool':
    case 'boolean':
      return {
        type: 'boolean',
        params: null
      };
    case 'datetime':
      // if the datetime is higher than default precision, have to use specific type to create it
      if (rawType.indexOf('(') !== -1) {
        return {
          type: 'specificType',
          params: convertRawToParams(rawType)
        };
      }
      return {
        type: 'dateTime',
        params: null
      };
    case 'time':
      // same for time
      if (rawType.indexOf('(') !== -1) {
        return {
          type: 'specificType',
          params: convertRawToParams(rawType)
        };
      }
      return {
        type: 'time',
        params: null
      };
    case 'blob':
      return {
        type: 'binary',
        params: null
      };
    case 'enum':
      {
        // the second parameter /is/ an array, so we have to wrangle accordingly
        var params = parseParameters(rawType);
        return {
          type: 'enu',
          params: ['[' + params.join(',') + ']']
        };
      }
    case 'decimal':
    case 'dec':
      return {
        type: 'decimal',
        params: parseParameters(rawType)
      };
    case 'float':
      return {
        type: 'float',
        params: parseParameters(rawType)
      };
    case 'year':
      return {
        type: 'specificType',
        params: convertRawToParams(rawType)
      };

    case 'text':
    case 'date':
    case 'timestamp':
      return {
        type: baseType,
        params: null
      };
    case 'binary':
    case 'varbinary':
    case 'real':
    case 'double':
    case 'double precision':
    case 'tinytext':
    case 'mediumtext':
    case 'longtext':
    case 'tinyblob':
    case 'mediumblob':
    case 'longblob':
    case 'bit':
    case 'set':
    case 'smallint':
    case 'mediumint':
      return {
        type: 'specificType',
        params: convertRawToParams(rawType)
      };
    default:
      // we hit something unexpected
      throw new Error('unexpected type encountered: ' + rawType);
  }
}

function convertRawToParams(rawType) {
  return ['\'' + rawType + '\''];
}

function checkUnsigned(rawType) {
  return rawType.indexOf('unsigned') !== -1;
}

function parseParameters(str) {
  // no parameters
  if (str.indexOf('(') === -1) {
    return null;
  }
  // get the string between parentheses, remove spaces, then split on commas
  return str.split('(')[1].split(')')[0].replace(' ', '').split(',');
}

function mysqlGetForeignKey(constraints) {
  if (constraints === null || constraints === undefined) {
    return null;
  }
  var fk = constraints.find(function (c) {
    return c.REFERENCED_TABLE_NAME !== null;
  });
  if (fk !== null && fk !== undefined) {
    return {
      table: fk.REFERENCED_TABLE_NAME,
      column: fk.REFERENCED_COLUMN_NAME
    };
  }
  return null;
}