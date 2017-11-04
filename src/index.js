import cp from 'child_process';
import Umzug from 'umzug';
import * as fileHelpers from './helpers/fileHelper';
import * as logger from './helpers/logger';
import * as adapter from './knex.adapter';

let migrationUmzug;

let seedUmzug;

function printList(list) {
  let num = 1;
  list.map((item) => {
    logger.log(`${num}: ${item.file}`);
    num += 1;
  });
}

export function createMigration(name, silent) {
  const migrationName = name !== undefined ? name : 'unnamed';
  try {
    const filePath = fileHelpers.getMigrationFilePath(migrationName);
    fileHelpers.write(filePath, fileHelpers.getMigrationTemplate());
    logger.log(`Migration ${filePath} created`, silent);
  } catch (err) {
    logger.error(`Error creating migration file: ${err}`);
  }
}

export function up(to, connection, silent) {
  setConnection(connection);
  setMigrationUmzug();

  return Promise.resolve()
    .then(() => {
      if (to && to !== null) {
        return migrationUmzug.up({ to })
          .then(() => {
            logger.log(`Migrations up to ${to} complete`, silent);
          });
      }
      return migrationUmzug.up()
        .then(() => {
          logger.log('All migrations complete', silent);
        });
    })
    .catch((err) => {
      logger.error(`Error running up migration(s): ${err}`);
    });
}

export function down(to, connection, silent) {
  setConnection(connection);
  setMigrationUmzug();

  return Promise.resolve()
    .then(() => {
      if (to && to !== null) {
        return migrationUmzug.down({ to })
          .then(() => {
            logger.log(`Migrations down to ${to} complete`, silent);
          });
      }
      return migrationUmzug.down()
        .then(() => {
          logger.log('Latest migration down complete', silent);
        });
    })
    .catch((err) => {
      logger.error(`Error running down migration(s): ${err}`);
    });
}

export function listExecuted(connection) {
  setConnection(connection);
  setMigrationUmzug();

  migrationUmzug.executed()
    .then((list) => {
      logger.log('Executed Migrations:');
      return list;
    })
    .then(printList)
    .then(() => {
      logger.log('\n');
    });
}

export function listPending(connection) {
  setConnection(connection);
  setMigrationUmzug();

  migrationUmzug.pending()
    .then((list) => {
      logger.log('\nPending Migrations:');
      return list;
    })
    .then(printList)
    .then(() => {
      logger.log('\n');
    });
}

export function listAll(connection) {
  setConnection(connection);
  setMigrationUmzug();

  migrationUmzug.executed()
    .then((list) => {
      logger.log('Executed Migrations:');
      return list;
    })
    .then(printList)
    .then(() => {
      logger.log('');
      logger.log('Pending Migrations:');
    })
    .then(() => {
      return migrationUmzug.pending();
    })
    .then(printList)
    .then(() => {
      logger.log('');
    });
}

export function listExecutedSeeds(connection) {
  setConnection(connection);
  setSeedUmzug();

  seedUmzug.executed()
    .then((list) => {
      logger.log('Applied Seeds:');
      return list;
    })
    .then(printList)
    .then(() => {
      logger.log('\n');
    });
}

export function listPendingSeeds(connection) {
  setConnection(connection);
  setSeedUmzug();

  seedUmzug.pending()
    .then((list) => {
      logger.log('\nUnapplied Seeds:');
      return list;
    })
    .then(printList)
    .then(() => {
      logger.log('\n');
    });
}

export function listAllSeeds(connection) {
  setConnection(connection);
  setSeedUmzug();

  seedUmzug.executed()
    .then((list) => {
      logger.log('Applied Seeds:');
      return list;
    })
    .then(printList)
    .then(() => {
      logger.log('');
      logger.log('Unapplied Seeds:');
    })
    .then(() => {
      return seedUmzug.pending();
    })
    .then(printList)
    .then(() => {
      logger.log('');
    });
}

export function listConnections() {
  logger.log('Available Connections (for use with the -c option): ');
  fileHelpers.getConnections().map((conn, index) => {
    logger.log(`${index + 1}: ${conn}`);
  });
}

export function createSeed(name, silent) {
  const seedName = name !== undefined ? name : 'unnamed';
  try {
    const filePath = fileHelpers.getSeedFilePath(seedName);
    fileHelpers.write(filePath, fileHelpers.getSeedTemplate());
    logger.log(`Seed ${filePath} created`, silent);
  } catch (err) {
    logger.error(`Error creating seed file: ${err}`);
  }
}

export function createModel(name, tableName, silent) {
  try {
    if (!name) {
      throw new Error('You must specify a name for the model');
    }

    let table = tableName;
    if (!tableName) {
      table = name;
      logger.warn(`No table name provided. Using model name "${name}" as the table name. This can be edited in the model file later.`, silent);
    }

    const filePath = fileHelpers.getModelFilePath(name);
    let templateText = fileHelpers.getModelTemplate();

    templateText = replace(templateText, '<#modelName>', name);
    templateText = replace(templateText, '<#tableName>', table);

    fileHelpers.write(filePath, templateText);
  } catch (err) {
    logger.error(`Error creating model file: ${err}`);
  }
}

export function createConn(connInfo, silent) {
  try {
    const filePath = fileHelpers.getConnFilePath(connInfo.name);
    let templateText = fileHelpers.getConnTemplate();

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
      templateText = replace(templateText, '<#pool>', `pool: { min: ${connInfo.poolMin}, max: ${connInfo.poolMax} },`);
    } else {
      templateText = replace(templateText, '<#pool>', '');
    }

    fileHelpers.write(filePath, templateText);
    logger.log(`New connection file ${filePath} successfully created`, silent);
  } catch (err) {
    logger.error(`Error creating connection: ${err}`);
  }
}

export function seed(file, connection, silent) {
  setConnection(connection);
  setSeedUmzug();

  return seedUmzug.up(file)
    .then(() => {
      logger.log(`${file} successfully seeded`, silent);
    })
    .catch((err) => {
      logger.error(`Error seeding the database: ${err}`);
    });
}

export function unseed(file, connection, silent) {
  setConnection(connection);
  setSeedUmzug();

  return seedUmzug.down(file)
    .then(() => {
      logger.log(`${file} unseeded`, silent);
    })
    .catch((err) => {
      logger.error(`Error unseeding: ${err}`);
    });
}

export function rebuildDb(connection, silent) {
  if (!connection) {
    // eslint-disable-next-line
    connection = 'default';
  }
  const configFile = fileHelpers.getConfigFilePath(`${connection}.js`);
  // TODO: is there a better way to do this now?
  // eslint-disable-next-line
  const config = require(configFile);
  const dbName = config.connection.database;
  delete config.connection.database;

  let knex = getConnection(config);
  return Promise.resolve()
    .then(() => {
      return knex.raw(`DROP DATABASE ${dbName}`)
        .then(() => {
          logger.log(`Dropped ${dbName} database`, silent);
        })
        .catch(() => {
          logger.warn(`Database ${dbName} not found. Creating.`);
        });
    })
    .then(() => {
      knex.raw(`CREATE DATABASE ${dbName}`);
    })
    .then(() => {
      logger.log(`Created ${dbName} database`, silent);
    })
    .then(() => {
      // reset the connection to connect to the database
      knex.destroy();
      config.connection.database = dbName;
      knex = getConnection(config);
      // run all migrations to recreate the schema
      return up(null, connection);
    })
    .then(() => {
      knex.destroy();
    })
    .catch((err) => {
      logger.error(`Error rebuilding database: ${err}`);
      knex.destroy();
    });
}

export function init() {
  try {
    const cDefault = fileHelpers.getInitFile('default.connection');
    const mTemplate = fileHelpers.getInitFile('migration.template');
    const sTemplate = fileHelpers.getInitFile('seed.template');
    const modelTemplate = fileHelpers.getInitFile('model.template');

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
    cp.exec('npm install --save cambio', (error) => {
      if (error) {
        logger.error('Could not install Cambio as a local dependency.  Please run "npm install cambio -S"');
      } else {
        logger.log('Cambio installed as a local dependency');
      }
    });
  } catch (err) {
    logger.error(`Error initializing Cambio: ${err}`);
  }
}

export function getConnection(config) {
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
  migrationUmzug = new Umzug({
    storage: `${__dirname}/helpers/storage`,
    storageOptions: {
      tableName: 'coMigrations',
    },
    migrations: {
      path: fileHelpers.getMigrationsPath(),
    },
  });
}

function setSeedUmzug() {
  seedUmzug = new Umzug({
    storage: `${__dirname}/helpers/storage`,
    storageOptions: {
      tableName: 'coSeeds',
    },
    migrations: {
      path: fileHelpers.getSeedsPath(),
    },
  });
}
