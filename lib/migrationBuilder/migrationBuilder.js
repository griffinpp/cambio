'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _mysqlAdapter = require('./mysqlAdapter');

var _mysqlAdapter2 = _interopRequireDefault(_mysqlAdapter);

var _sqliteAdapter = require('./sqliteAdapter');

var _sqliteAdapter2 = _interopRequireDefault(_sqliteAdapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// should export a function that takes a connection config and uses info in the connection
// to determine what adapter to use. Adpters should return an array of table information objects
// that the knexBuilder knows how to sort and convert into knex code.

exports.default = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(config) {
    var tableInfo, sortedTables, up, down, migrationText;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            tableInfo = void 0;

            if (!(config.client === 'mysql')) {
              _context.next = 7;
              break;
            }

            _context.next = 4;
            return (0, _mysqlAdapter2.default)(config);

          case 4:
            tableInfo = _context.sent;
            _context.next = 18;
            break;

          case 7:
            if (!(config.client === 'sqlite3')) {
              _context.next = 13;
              break;
            }

            _context.next = 10;
            return (0, _sqliteAdapter2.default)(config);

          case 10:
            tableInfo = _context.sent;
            _context.next = 18;
            break;

          case 13:
            if (!(config.client === 'pg')) {
              _context.next = 17;
              break;
            }

            throw new Error('Postgres support is still in development');

          case 17:
            throw new Error('Unsupported client specified: ' + config.client);

          case 18:
            sortedTables = sortTablesByReferences(tableInfo);
            up = buildSchemaKnex(sortedTables);
            down = buildTeardownKnex(sortedTables);
            migrationText = buildMigrationKnex(up, down);

            console.log(migrationText);

          case 23:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function buildMigration(_x) {
    return _ref.apply(this, arguments);
  }

  return buildMigration;
}();

function sortTablesByReferences(unsortedTables) {
  var sortedTables = [];
  var tableNames = unsortedTables.map(function (t) {
    return t.name;
  });

  var _loop = function _loop() {
    var sortedNames = sortedTables.map(function (t) {
      return t.name;
    });
    // get only tables that still haven't been sorted
    var currentUnsortedTables = unsortedTables.filter(function (t) {
      return sortedNames.indexOf(t.name) === -1;
    });
    // filter through unsorted tables and find ones without fks to tables that haven't been added
    currentUnsortedTables.forEach(function (t) {
      if (tableOnlyReferences(t, sortedNames)) {
        sortedTables.push(t);
      }
    });
  };

  while (sortedTables.length < tableNames.length) {
    _loop();
  }
  return sortedTables;
}

// true if the given table only has references to the given list of table names or itself, false otherwise
function tableOnlyReferences(tableInfo, tableNames) {
  return tableInfo.columns.reduce(function (acc, c) {
    if (tableNames !== null && tableNames !== undefined && tableNames.length > 0) {
      return acc && (c.foreignKey === null || tableNames.indexOf(c.foreignKey.table) !== -1
      // self-referential FK!
      || tableInfo.name === c.foreignKey.table);
    }
    return acc && c.foreignKey === null;
  }, true);
}

function buildTableKnex(tableData) {
  var output = [];
  output.push('      .createTableIfNotExists(\'' + tableData.name + '\', (t) => {');
  tableData.columns.forEach(function (c) {
    var colData = [];
    // build the parameters for the type function
    var typeParams = ['\'' + c.name + '\''];
    if (c.knexType.params !== null) {
      typeParams = [].concat((0, _toConsumableArray3.default)(typeParams), (0, _toConsumableArray3.default)(c.knexType.params));
    }
    // output the column type
    colData.push('        t.' + c.knexType.type + '(' + typeParams.join(', ') + ')');
    // check nullability
    if (c.knexType.type !== 'timestamp' && c.knexType.type !== 'increments' && c.notNullable) {
      colData.push('          .notNullable()');
    }
    // check for unsigned status
    if (c.knexType.type !== 'increments' && c.unsigned) {
      colData.push('          .unsigned()');
    }
    // check for default value
    if (c.knexType.type !== 'timestamp' && c.default !== null) {
      // unless it's only digits, wrap in single quotes
      var d = c.default;
      if (!/^\d+$/.test(c.default)) {
        d = '\'' + d + '\'';
      }
      colData.push('          .defaultTo(' + d + ')');
    }
    // check for foreign keys
    if (c.foreignKey !== null) {
      colData.push('          .references(\'' + c.foreignKey.column + '\')');
      colData.push('          .inTable(\'' + c.foreignKey.table + '\')');
    }
    // join it all together
    var column = colData.join('\n') + ';';
    // and push it onto the output array
    output.push(column);
  });
  output.push('      })');
  return output.join('\n');
}

function buildSchemaKnex(tables) {
  var output = [];
  output.push('    return connection.schema');
  tables.forEach(function (t) {
    output.push(buildTableKnex(t));
  });
  return output.join('\n');
}

function buildTeardownKnex(tables) {
  var output = [];
  output.push('    return connection.schema');
  // tables should be dropped in reverse order
  tables.reverse().forEach(function (t) {
    output.push('      .dropTable(\'' + t.name + '\')');
  });
  return output.join('\n');
}

function buildMigrationKnex(upKnex, downKnex) {
  var output = [];
  output.push('const co = require(\'cambio\');');
  // eslint-disable-next-line
  output.push('const config = require(`../config/${process.env.connection}.js`);');
  output.push('module.exports = {');
  output.push('  up() {');
  output.push('    const connection = co.getConnection(config);');
  output.push(upKnex);
  output.push('      .catch((err) => {');
  output.push('        console.log(err);');
  output.push('      })');
  output.push('      .finally(() => {');
  output.push('        connection.destroy();');
  output.push('      });');
  output.push('  },');
  output.push('  down() {');
  output.push('    const connection = co.getConnection(config);');
  output.push(downKnex);
  output.push('      .catch((err) => {');
  output.push('        console.log(err);');
  output.push('      })');
  output.push('      .finally(() => {');
  output.push('        connection.destroy();');
  output.push('      });');
  output.push('  },');
  output.push('}');
  return output.join('\n');
}