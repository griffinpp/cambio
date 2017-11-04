'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMigration = createMigration;
exports.up = up;
exports.down = down;
exports.listExecuted = listExecuted;
exports.listPending = listPending;
exports.listAll = listAll;
exports.listExecutedSeeds = listExecutedSeeds;
exports.listPendingSeeds = listPendingSeeds;
exports.listAllSeeds = listAllSeeds;
exports.listConnections = listConnections;
exports.createSeed = createSeed;
exports.createModel = createModel;
exports.createConn = createConn;
exports.seed = seed;
exports.unseed = unseed;
exports.rebuildDb = rebuildDb;
exports.init = init;
exports.getConnection = getConnection;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _umzug = require('umzug');

var _umzug2 = _interopRequireDefault(_umzug);

var _fileHelper = require('./helpers/fileHelper');

var fileHelpers = _interopRequireWildcard(_fileHelper);

var _logger = require('./helpers/logger');

var logger = _interopRequireWildcard(_logger);

var _knex = require('./knex.adapter');

var adapter = _interopRequireWildcard(_knex);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var migrationUmzug = void 0;

var seedUmzug = void 0;

function printList(list) {
  var num = 1;
  list.map(function (item) {
    logger.log(num + ': ' + item.file);
    num += 1;
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

function up(to, connection, silent) {
  setConnection(connection);
  setMigrationUmzug();

  return Promise.resolve().then(function () {
    if (to && to !== null) {
      return migrationUmzug.up({ to: to }).then(function () {
        logger.log('Migrations up to ' + to + ' complete', silent);
      });
    }
    return migrationUmzug.up().then(function () {
      logger.log('All migrations complete', silent);
    });
  }).catch(function (err) {
    logger.error('Error running up migration(s): ' + err);
  });
}

function down(to, connection, silent) {
  setConnection(connection);
  setMigrationUmzug();

  return Promise.resolve().then(function () {
    if (to && to !== null) {
      return migrationUmzug.down({ to: to }).then(function () {
        logger.log('Migrations down to ' + to + ' complete', silent);
      });
    }
    return migrationUmzug.down().then(function () {
      logger.log('Latest migration down complete', silent);
    });
  }).catch(function (err) {
    logger.error('Error running down migration(s): ' + err);
  });
}

function listExecuted(connection) {
  setConnection(connection);
  setMigrationUmzug();

  migrationUmzug.executed().then(function (list) {
    logger.log('Executed Migrations:');
    return list;
  }).then(printList).then(function () {
    logger.log('\n');
  });
}

function listPending(connection) {
  setConnection(connection);
  setMigrationUmzug();

  migrationUmzug.pending().then(function (list) {
    logger.log('\nPending Migrations:');
    return list;
  }).then(printList).then(function () {
    logger.log('\n');
  });
}

function listAll(connection) {
  setConnection(connection);
  setMigrationUmzug();

  migrationUmzug.executed().then(function (list) {
    logger.log('Executed Migrations:');
    return list;
  }).then(printList).then(function () {
    logger.log('');
    logger.log('Pending Migrations:');
  }).then(function () {
    return migrationUmzug.pending();
  }).then(printList).then(function () {
    logger.log('');
  });
}

function listExecutedSeeds(connection) {
  setConnection(connection);
  setSeedUmzug();

  seedUmzug.executed().then(function (list) {
    logger.log('Applied Seeds:');
    return list;
  }).then(printList).then(function () {
    logger.log('\n');
  });
}

function listPendingSeeds(connection) {
  setConnection(connection);
  setSeedUmzug();

  seedUmzug.pending().then(function (list) {
    logger.log('\nUnapplied Seeds:');
    return list;
  }).then(printList).then(function () {
    logger.log('\n');
  });
}

function listAllSeeds(connection) {
  setConnection(connection);
  setSeedUmzug();

  seedUmzug.executed().then(function (list) {
    logger.log('Applied Seeds:');
    return list;
  }).then(printList).then(function () {
    logger.log('');
    logger.log('Unapplied Seeds:');
  }).then(function () {
    return seedUmzug.pending();
  }).then(printList).then(function () {
    logger.log('');
  });
}

function listConnections() {
  logger.log('Available Connections (for use with the -c option): ');
  fileHelpers.getConnections().map(function (conn, index) {
    logger.log(index + 1 + ': ' + conn);
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

function seed(file, connection, silent) {
  setConnection(connection);
  setSeedUmzug();

  return seedUmzug.up(file).then(function () {
    logger.log(file + ' successfully seeded', silent);
  }).catch(function (err) {
    logger.error('Error seeding the database: ' + err);
  });
}

function unseed(file, connection, silent) {
  setConnection(connection);
  setSeedUmzug();

  return seedUmzug.down(file).then(function () {
    logger.log(file + ' unseeded', silent);
  }).catch(function (err) {
    logger.error('Error unseeding: ' + err);
  });
}

function rebuildDb(connection, silent) {
  if (!connection) {
    // eslint-disable-next-line
    connection = 'default';
  }
  var configFile = fileHelpers.getConfigFilePath(connection + '.js');
  // TODO: is there a better way to do this now?
  // eslint-disable-next-line
  var config = require(configFile);
  var dbName = config.connection.database;
  delete config.connection.database;

  var knex = getConnection(config);
  return Promise.resolve().then(function () {
    return knex.raw('DROP DATABASE ' + dbName).then(function () {
      logger.log('Dropped ' + dbName + ' database', silent);
    }).catch(function () {
      logger.warn('Database ' + dbName + ' not found. Creating.');
    });
  }).then(function () {
    knex.raw('CREATE DATABASE ' + dbName);
  }).then(function () {
    logger.log('Created ' + dbName + ' database', silent);
  }).then(function () {
    // reset the connection to connect to the database
    knex.destroy();
    config.connection.database = dbName;
    knex = getConnection(config);
    // run all migrations to recreate the schema
    return up(null, connection);
  }).then(function () {
    knex.destroy();
  }).catch(function (err) {
    logger.error('Error rebuilding database: ' + err);
    knex.destroy();
  });
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

    logger.log('Cambio successfully initialized in this directory');
    logger.log('Installing Cambio as a local dependency.  Please wait...');

    // install the local database adapter
    _child_process2.default.exec('npm install --save cambio', function (error) {
      if (error) {
        logger.error('Could not install Cambio as a local dependency.  Please run "npm install cambio -S"');
      } else {
        logger.log('Cambio installed as a local dependency');
      }
    });
  } catch (err) {
    logger.error('Error initializing Cambio: ' + err);
  }
}

function getConnection(config) {
  return adapter.connect(config);
}

function replace(string, find, rep) {
  return string.split(find).join(rep);
}

function setConnection(connection) {
  if (connection) {
    process.env.connection = connection;
  } else {
    process.env.connection = 'default';
  }
}

function setMigrationUmzug() {
  migrationUmzug = new _umzug2.default({
    storage: __dirname + '/helpers/storage',
    storageOptions: {
      tableName: 'coMigrations'
    },
    migrations: {
      path: fileHelpers.getMigrationsPath()
    }
  });
}

function setSeedUmzug() {
  seedUmzug = new _umzug2.default({
    storage: __dirname + '/helpers/storage',
    storageOptions: {
      tableName: 'coSeeds'
    },
    migrations: {
      path: fileHelpers.getSeedsPath()
    }
  });
}