'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rebuildDb = exports.unseed = exports.seed = exports.listAllSeeds = exports.listPendingSeeds = exports.listExecutedSeeds = exports.listAll = exports.listExecuted = exports.down = exports.up = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var up = exports.up = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(to, connectionName, silent) {
    var connection, mUmzug;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            connection = getConnectionFromName(connectionName);
            mUmzug = getMigrationUmzug(connection);
            _context.prev = 2;

            if (!(to && to !== null)) {
              _context.next = 8;
              break;
            }

            _context.next = 6;
            return mUmzug.up({ to: to });

          case 6:
            logger.log('Migrations up to ' + to + ' complete', silent);
            return _context.abrupt('return');

          case 8:
            _context.next = 10;
            return mUmzug.up();

          case 10:
            logger.log('All migrations complete', silent);
            return _context.abrupt('return');

          case 14:
            _context.prev = 14;
            _context.t0 = _context['catch'](2);

            logger.error('Error running up migration(s): ' + _context.t0.stack);

          case 17:
            _context.prev = 17;

            connection.destroy();
            return _context.finish(17);

          case 20:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 14, 17, 20]]);
  }));

  return function up(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var down = exports.down = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(to, connectionName, silent) {
    var connection, mUmzug;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            connection = getConnectionFromName(connectionName);
            mUmzug = getMigrationUmzug(connection);
            _context2.prev = 2;

            if (!(to && to !== null)) {
              _context2.next = 8;
              break;
            }

            _context2.next = 6;
            return mUmzug.down({ to: to });

          case 6:
            logger.log('Migrations down to ' + to + ' complete', silent);
            return _context2.abrupt('return');

          case 8:
            _context2.next = 10;
            return mUmzug.down();

          case 10:
            logger.log('Latest migration down complete', silent);
            return _context2.abrupt('return');

          case 14:
            _context2.prev = 14;
            _context2.t0 = _context2['catch'](2);

            logger.error('Error running down migration(s): ' + _context2.t0);

          case 17:
            _context2.prev = 17;

            connection.destroy();
            return _context2.finish(17);

          case 20:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[2, 14, 17, 20]]);
  }));

  return function down(_x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}();

var listExecuted = exports.listExecuted = function () {
  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(connectionName) {
    var connection, mUmzug, list;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            connection = getConnectionFromName(connectionName);
            mUmzug = getMigrationUmzug(connection);
            _context3.prev = 2;
            _context3.next = 5;
            return mUmzug.executed();

          case 5:
            list = _context3.sent;

            logger.log('Executed Migrations');
            printList(list);
            logger.log('\n');
            _context3.next = 14;
            break;

          case 11:
            _context3.prev = 11;
            _context3.t0 = _context3['catch'](2);

            logger.error('Error listing migrations: ' + _context3.t0);

          case 14:
            _context3.prev = 14;

            connection.destroy();
            return _context3.finish(14);

          case 17:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[2, 11, 14, 17]]);
  }));

  return function listExecuted(_x7) {
    return _ref3.apply(this, arguments);
  };
}();

var listAll = exports.listAll = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(connectionName) {
    var connection, mUmzug, eList, pList;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            connection = getConnectionFromName(connectionName);
            mUmzug = getMigrationUmzug(connection);
            _context4.prev = 2;
            _context4.next = 5;
            return mUmzug.executed();

          case 5:
            eList = _context4.sent;
            _context4.next = 8;
            return mUmzug.pending();

          case 8:
            pList = _context4.sent;

            logger.log('Executed Migrations:');
            printList(eList);
            logger.log('');
            logger.log('Pending Migrations');
            printList(pList);
            logger.log('');
            _context4.next = 20;
            break;

          case 17:
            _context4.prev = 17;
            _context4.t0 = _context4['catch'](2);

            logger.error('Error listing migrations: ' + _context4.t0);

          case 20:
            _context4.prev = 20;

            connection.destroy();
            return _context4.finish(20);

          case 23:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[2, 17, 20, 23]]);
  }));

  return function listAll(_x8) {
    return _ref4.apply(this, arguments);
  };
}();

var listExecutedSeeds = exports.listExecutedSeeds = function () {
  var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(connectionName) {
    var connection, sUmzug, list;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            connection = getConnectionFromName(connectionName);
            sUmzug = getSeedUmzug(connection);
            _context5.prev = 2;
            _context5.next = 5;
            return sUmzug.executed();

          case 5:
            list = _context5.sent;

            logger.log('Applied Seeds:');
            printList(list);
            logger.log('\n');
            _context5.next = 14;
            break;

          case 11:
            _context5.prev = 11;
            _context5.t0 = _context5['catch'](2);

            logger.error('Error listing seeds: ' + _context5.t0);

          case 14:
            _context5.prev = 14;

            connection.destroy();
            return _context5.finish(14);

          case 17:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this, [[2, 11, 14, 17]]);
  }));

  return function listExecutedSeeds(_x9) {
    return _ref5.apply(this, arguments);
  };
}();

var listPendingSeeds = exports.listPendingSeeds = function () {
  var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(connectionName) {
    var connection, sUmzug, list;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            connection = getConnectionFromName(connectionName);
            sUmzug = getSeedUmzug(connection);
            _context6.prev = 2;
            _context6.next = 5;
            return sUmzug.pending();

          case 5:
            list = _context6.sent;

            logger.log('Unapplied Seeds:');
            printList(list);
            logger.log('\n');
            _context6.next = 14;
            break;

          case 11:
            _context6.prev = 11;
            _context6.t0 = _context6['catch'](2);

            logger.error('Error listing seeds: ' + _context6.t0);

          case 14:
            _context6.prev = 14;

            connection.destroy();
            return _context6.finish(14);

          case 17:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this, [[2, 11, 14, 17]]);
  }));

  return function listPendingSeeds(_x10) {
    return _ref6.apply(this, arguments);
  };
}();

var listAllSeeds = exports.listAllSeeds = function () {
  var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7(connectionName) {
    var connection, sUmzug, aList, uList;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            connection = getConnectionFromName(connectionName);
            sUmzug = getSeedUmzug(connection);
            _context7.prev = 2;
            _context7.next = 5;
            return sUmzug.executed();

          case 5:
            aList = _context7.sent;
            _context7.next = 8;
            return sUmzug.pending();

          case 8:
            uList = _context7.sent;

            logger.log('Applied Seeds:');
            printList(aList);
            logger.log('');
            logger.log('Unapplied Seeds:');
            printList(uList);
            logger.log('');
            _context7.next = 20;
            break;

          case 17:
            _context7.prev = 17;
            _context7.t0 = _context7['catch'](2);

            logger.error('Error listing seeds: ' + _context7.t0);

          case 20:
            _context7.prev = 20;

            connection.destroy();
            return _context7.finish(20);

          case 23:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this, [[2, 17, 20, 23]]);
  }));

  return function listAllSeeds(_x11) {
    return _ref7.apply(this, arguments);
  };
}();

var seed = exports.seed = function () {
  var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8(file, connectionName, silent) {
    var connection, sUmzug;
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            connection = getConnectionFromName(connectionName);
            sUmzug = getSeedUmzug(connection);
            _context8.prev = 2;
            _context8.next = 5;
            return sUmzug.up(file);

          case 5:
            logger.log(file + ' successfully seeded', silent);
            _context8.next = 11;
            break;

          case 8:
            _context8.prev = 8;
            _context8.t0 = _context8['catch'](2);

            logger.error('Error seeding the database: ' + _context8.t0);

          case 11:
            _context8.prev = 11;

            connection.destroy();
            return _context8.finish(11);

          case 14:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this, [[2, 8, 11, 14]]);
  }));

  return function seed(_x12, _x13, _x14) {
    return _ref8.apply(this, arguments);
  };
}();

var unseed = exports.unseed = function () {
  var _ref9 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9(file, connectionName, silent) {
    var connection, sUmzug;
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            connection = getConnectionFromName(connectionName);
            sUmzug = getSeedUmzug(connection);
            _context9.prev = 2;
            _context9.next = 5;
            return sUmzug.down(file);

          case 5:
            logger.log(file + ' unseeded', silent);
            _context9.next = 11;
            break;

          case 8:
            _context9.prev = 8;
            _context9.t0 = _context9['catch'](2);

            logger.error('Error unseeding: ' + _context9.t0);

          case 11:
            _context9.prev = 11;

            connection.destroy();
            return _context9.finish(11);

          case 14:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this, [[2, 8, 11, 14]]);
  }));

  return function unseed(_x15, _x16, _x17) {
    return _ref9.apply(this, arguments);
  };
}();

var rebuildDb = exports.rebuildDb = function () {
  var _ref10 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10(connectionName, silent) {
    var configFile, config, dbName, knex;
    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            if (!connectionName) {
              // eslint-disable-next-line
              connectionName = 'default';
            }
            configFile = fileHelpers.getConfigFilePath(connectionName + '.js');
            // TODO: is there a better way to do this now?
            // eslint-disable-next-line

            config = require(configFile);
            dbName = config.connection.database;

            delete config.connection.database;

            knex = getConnection(config);
            _context10.prev = 6;
            _context10.prev = 7;
            _context10.next = 10;
            return knex.raw('DROP DATABASE ' + dbName);

          case 10:
            logger.log('Dropped ' + dbName + ' database', silent);
            _context10.next = 16;
            break;

          case 13:
            _context10.prev = 13;
            _context10.t0 = _context10['catch'](7);

            logger.warn('Database ' + dbName + ' not found. Creating.');

          case 16:
            _context10.next = 18;
            return knex.raw('CREATE DATABASE ' + dbName);

          case 18:
            logger.log('Created ' + dbName + ' database', silent);
            // destroy and recreate the connection now that the db has been created
            knex.destroy();
            config.connection.database = dbName;
            knex = getConnection(config);
            _context10.next = 24;
            return up(null, connectionName);

          case 24:
            knex.destroy();
            _context10.next = 31;
            break;

          case 27:
            _context10.prev = 27;
            _context10.t1 = _context10['catch'](6);

            logger.error('Error rebuilding database: ' + _context10.t1);
            knex.destroy();

          case 31:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this, [[6, 27], [7, 13]]);
  }));

  return function rebuildDb(_x18, _x19) {
    return _ref10.apply(this, arguments);
  };
}();

exports.createMigration = createMigration;
exports.listPending = listPending;
exports.listConnections = listConnections;
exports.createSeed = createSeed;
exports.createModel = createModel;
exports.createConn = createConn;
exports.init = init;
exports.getConnection = getConnection;

var _umzug = require('umzug');

var _umzug2 = _interopRequireDefault(_umzug);

var _fileHelper = require('./helpers/fileHelper');

var fileHelpers = _interopRequireWildcard(_fileHelper);

var _logger = require('./helpers/logger');

var logger = _interopRequireWildcard(_logger);

var _knex = require('./knex.adapter');

var _knex2 = _interopRequireDefault(_knex);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function printList(list) {
  list.forEach(function (item, i) {
    logger.log(i + 1 + ': ' + item.file);
  });
}

function createMigration(name, silent) {
  var migrationName = name !== undefined ? name : 'unnamed';
  try {
    var filePath = fileHelpers.getMigrationFilePath(migrationName);
    fileHelpers.write(filePath, fileHelpers.getMigrationTemplate());
    logger.log('Migration ' + filePath + ' created', silent);
  } catch (err) {
    logger.error('Error creating migration file: ' + err);
  }
}

function listPending(connectionName) {
  var connection = getConnectionFromName(connectionName);
  var mUmzug = getMigrationUmzug(connection);

  try {
    var list = mUmzug.pending();
    printList(list);
    logger.log('\n');
  } catch (e) {
    logger.error('Error listing migrations: ' + e);
  } finally {
    connection.destroy();
  }
}

function listConnections() {
  logger.log('Available Connections (for use with the -c option): ');
  fileHelpers.getConnections().forEach(function (c, i) {
    logger.log(i + 1 + ': ' + c);
  });
}

function createSeed(name, silent) {
  var seedName = name !== undefined ? name : 'unnamed';
  try {
    var filePath = fileHelpers.getSeedFilePath(seedName);
    fileHelpers.write(filePath, fileHelpers.getSeedTemplate());
    logger.log('Seed ' + filePath + ' created', silent);
  } catch (err) {
    logger.error('Error creating seed file: ' + err);
  }
}

function createModel(name, tableName, silent) {
  try {
    if (!name) {
      throw new Error('You must specify a name for the model');
    }

    var table = tableName;
    if (!tableName) {
      table = name;
      logger.warn('No table name provided. Using model name "' + name + '" as the table name. This can be edited in the model file later.', silent);
    }

    var filePath = fileHelpers.getModelFilePath(name);
    var templateText = fileHelpers.getModelTemplate();

    templateText = replace(templateText, '<#modelName>', name);
    templateText = replace(templateText, '<#tableName>', table);

    fileHelpers.write(filePath, templateText);
  } catch (err) {
    logger.error('Error creating model file: ' + err);
  }
}

function createConn(connInfo, silent) {
  try {
    var filePath = fileHelpers.getConnFilePath(connInfo.name);
    var templateText = fileHelpers.getConnTemplate();

    templateText = replace(templateText, '<#host>', connInfo.host);
    templateText = replace(templateText, '<#port>', connInfo.port);
    templateText = replace(templateText, '<#user>', connInfo.user);
    templateText = replace(templateText, '<#password>', connInfo.password);
    templateText = replace(templateText, '<#database>', connInfo.database);

    if (connInfo.aws) {
      templateText = replace(templateText, '<#ssl>', 'ssl: \'Amazon RDS\',');
    } else {
      templateText = replace(templateText, '<#ssl>', '');
    }

    if (connInfo.pool) {
      // eslint-disable-next-line
      connInfo.poolMin = connInfo.poolMin || 2;
      // eslint-disable-next-line
      connInfo.poolMax = connInfo.poolMax || 10;
      templateText = replace(templateText, '<#pool>', 'pool: { min: ' + connInfo.poolMin + ', max: ' + connInfo.poolMax + ' },');
    } else {
      templateText = replace(templateText, '<#pool>', '');
    }

    fileHelpers.write(filePath, templateText);
    logger.log('New connection file ' + filePath + ' successfully created', silent);
  } catch (err) {
    logger.error('Error creating connection: ' + err);
  }
}

function init() {
  try {
    var cDefault = fileHelpers.getInitFile('default.connection');
    var mTemplate = fileHelpers.getInitFile('migration.template');
    var sTemplate = fileHelpers.getInitFile('seed.template');
    var modelTemplate = fileHelpers.getInitFile('model.template');

    fileHelpers.makeDir('config');
    fileHelpers.makeDir('migrations');
    fileHelpers.makeDir('seeds');
    fileHelpers.makeDir('models');

    fileHelpers.write(fileHelpers.getConfigFilePath('default.js'), cDefault);
    fileHelpers.write(fileHelpers.getConfigFilePath('migration.template'), mTemplate);
    fileHelpers.write(fileHelpers.getConfigFilePath('seed.template'), sTemplate);
    fileHelpers.write(fileHelpers.getConfigFilePath('model.template'), modelTemplate);

    logger.log('Cambio folders and templates successfully initialized in this directory');
  } catch (err) {
    logger.error('Error initializing Cambio: ' + err);
  }
}

function getConnection(config) {
  return (0, _knex2.default)(config);
}

function getConnectionFromName(connectionName) {
  if (!connectionName) {
    // eslint-disable-next-line
    connectionName = 'default';
  }
  var configFile = fileHelpers.getConfigFilePath(connectionName + '.js');
  // eslint-disable-next-line
  var config = require(configFile);
  return getConnection(config);
}

function replace(string, find, rep) {
  return string.split(find).join(rep);
}

function getMigrationUmzug(activeConnection) {
  return new _umzug2.default({
    storage: __dirname + '/objects/CustomStorage',
    storageOptions: {
      tableName: 'cambioMigrations',
      connection: activeConnection
    },
    migrations: {
      params: [activeConnection],
      path: fileHelpers.getMigrationsPath()
    }
  });
}

function getSeedUmzug(activeConnection) {
  return new _umzug2.default({
    storage: __dirname + '/helpers/storage',
    storageOptions: {
      tableName: 'cambioSeeds',
      connection: activeConnection
    },
    migrations: {
      params: [activeConnection],
      path: fileHelpers.getSeedsPath()
    }
  });
}