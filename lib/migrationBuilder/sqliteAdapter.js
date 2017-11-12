'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var getSqliteTableNames = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(connection) {
    var result;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return connection.raw('\n    select name from sqlite_master\n    where type=\'table\'\n    and name not like \'sqlite_%\'\n    order by name;\n  ');

          case 2:
            result = _context2.sent;
            return _context2.abrupt('return', result.map(function (t) {
              return t.name;
            }));

          case 4:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function getSqliteTableNames(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

// eslint-disable-next-line


var getSqliteTableInformation = function () {
  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(connection, tableName) {
    var rawColumnInfo, rawForeigns, rawAutoIncrement;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return connection.raw('pragma table_info(' + tableName + ')');

          case 2:
            rawColumnInfo = _context3.sent;
            _context3.next = 5;
            return connection.raw('pragma foreign_key_list(' + tableName + ')');

          case 5:
            rawForeigns = _context3.sent;
            _context3.next = 8;
            return connection.raw('SELECT 1 FROM sqlite_master WHERE tbl_name="' + tableName + '" and sql like \'%autoincrement%\';');

          case 8:
            rawAutoIncrement = _context3.sent;
            return _context3.abrupt('return', {
              name: tableName,
              columns: rawColumnInfo.map(function (column) {
                // this second array contains additional metadata about the column. Maybe not needed?
                // const metadata = rawColumnInfo[1][i];
                var fk = rawForeigns.filter(function (c) {
                  return c.from === column.name;
                });
                var foreignKey = fk.length === 0 ? null : { table: fk[0].table, column: fk[0].to };

                return {
                  name: column.name,
                  rawType: column.type,
                  knexType: sqliteParseType(column.type, column.pk, rawAutoIncrement),
                  notNullable: column.notnull === 1,
                  // don't think you can specify an unsigned int column in sqlite in a way that will not just be converted to integer
                  unsigned: false,
                  // TODO
                  unique: false,
                  default: column.dflt_value,
                  primary: column.pk === 1,
                  foreignKey: foreignKey
                };
              }),
              indexes: {}
            });

          case 10:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function getSqliteTableInformation(_x3, _x4) {
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
            return getSqliteTableNames(connection);

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
            return getSqliteTableInformation(connection, tableNames[i]);

          case 10:
            tableInfo = _context.sent;

            tables.push(tableInfo);

          case 12:
            i++;
            _context.next = 7;
            break;

          case 15:
            connection.destroy();
            // console.log(JSON.stringify(tables, null, 2));
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

function sqliteParseType(rawType, pk, tableAutoIncrement) {
  /* note that sqlite doesn't actually care that much about types and will even let you
    make up types when you're creating a table, so something like:
     CREATE TABLE `myTable` (
      `id` INTEGER,
      `someColumn` DERP
    );
    is completely valid, so we do our best to guess at likely column types based on sqlite docs and what
    knex generates in the first place...
    Types that have funcitons in knex:
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
  if (pk && tableAutoIncrement.length > 0) {
    return {
      type: 'increments',
      params: null
    };
  }
  var baseType = /[a-z]*/.exec(rawType)[0].toLowerCase();
  switch (baseType) {
    case 'int':
    case 'integer':
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
      return {
        type: 'integer',
        params: null
      };
    case 'bigint':
      return {
        type: 'bigInteger',
        params: null
      };
    case 'char':
    case 'varchar':
    case 'text':
    case 'tinytext':
    case 'mediumtext':
    case 'longtext':
      return {
        type: 'string',
        params: parseParameters(rawType)
      };
    case 'bool':
    case 'boolean':
      return {
        type: 'boolean',
        params: null
      };
    case 'year':
    case 'datetime':
    case 'date':
      return {
        type: 'dateTime',
        params: null
      };
    case 'time':
    case 'timestamp':
      return {
        type: 'time',
        params: null
      };
    case 'blob':
    case 'tinyblob':
    case 'mediumblob':
    case 'longblob':
    case 'binary':
    case 'varbinary':
      return {
        type: 'binary',
        params: null
      };
    case 'decimal':
    case 'dec':
      return {
        type: 'decimal',
        params: parseParameters(rawType)
      };
    case 'float':
    case 'real':
    case 'double':
    case 'double precision':
      return {
        type: 'float',
        params: parseParameters(rawType)
      };
    default:
      // we hit something unexpected, return a string type, anything can be stored here anyway...
      return {
        type: 'string',
        params: null
      };
  }
}

function parseParameters(str) {
  // no parameters
  if (str.indexOf('(') === -1) {
    return null;
  }
  // get the string between parentheses, remove spaces, then split on commas
  return str.split('(')[1].split(')')[0].replace(' ', '').split(',');
}