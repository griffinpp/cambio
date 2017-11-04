'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mysqlAdapter = require('./mysqlAdapter');

var _mysqlAdapter2 = _interopRequireDefault(_mysqlAdapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// should export a function that takes a connection config and uses info in the connection
// to determine what adapter to use. Adpters should return an array of table information objects
// that the knexBuilder knows how to sort and convert into knex code.

exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(config) {
    var tableInfo, sortedTables, up, down, migrationText;
    return regeneratorRuntime.wrap(function _callee$(_context) {
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
            _context.next = 8;
            break;

          case 7:
            throw new Error('Unsupported client specified: ' + config.client);

          case 8:
            sortedTables = sortTablesByReferences(tableInfo);
            up = buildSchemaKnex(sortedTables);
            down = buildTeardownKnex(sortedTables);
            // TODO: use sorted tables to build the "down" portion of the migration, then put it all together

            migrationText = buildMigrationKnex(up, down);

            console.log(migrationText);

          case 13:
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
      typeParams = [].concat(_toConsumableArray(typeParams), _toConsumableArray(c.knexType.params));
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