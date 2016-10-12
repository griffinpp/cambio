'use strict';

import * as fileHelpers from './helpers/fileHelper';
import Umzug from 'umzug';
import * as logger from './helpers/logger';
import cp from 'child_process';
import * as knex from './knex.adapter';

let migrationUmzug;

let seedUmzug;

function printList(list) {
  let num = 1;
  list.map((item) => {
    logger.log(`${num}: ${item.file}`);
    num += 1;
  });
}

export function createMigration(name) {
  let migrationName = name ? name : 'unnamed';
  try {
    let filePath = fileHelpers.getMigrationFilePath(migrationName);
    fileHelpers.write(filePath, fileHelpers.getMigrationTemplate());
    logger.log(`Migration ${filePath} created`);
  } catch (err) {
    logger.error(`Error creating migration file: ${err}`);
  }
}

export function up(to, connection) {
  setConnection(connection);
  setMigrationUmzug();

  return Promise.resolve()
    .then(() => {
      if (to && to !== null) {
        return migrationUmzug.up({to})
          .then(() => {
            logger.log(`Migrations up to ${to} complete`);    
          });
      } else {
        return migrationUmzug.up()
          .then(() => {
            logger.log(`All migrations complete`);
          });
      }
    })
    .catch((err) => {
      logger.error(`Error running up migration(s): ${err}`); 
    });
}

export function down(to, connection) {
  setConnection(connection);
  setMigrationUmzug();

  return Promise.resolve()
    .then(() => {
      if (to && to !== null) {
        return migrationUmzug.down({to})
          .then(() => {
            logger.log(`Migrations down to ${to} complete`);      
          });        
      } else {
        return migrationUmzug.down()
          .then(() => {
             logger.log(`Latest migration down complete`); 
          });
      }
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
      return list
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
      return list
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

export function createSeed(name) {
  let seedName = name ? name : 'unnamed';
  try {
    let filePath = fileHelpers.getSeedFilePath(seedName);
    fileHelpers.write(filePath, fileHelpers.getSeedTemplate());
    logger.log(`Seed ${filePath} created`);
  } catch (err) {
    logger.error(`Error creating seed file: ${err}`);
  }
}

export function createModel(name, tableName) {
  try {
    if (!name) {
      throw new Error('You must specify a name for the model');
    }

    if (!tableName) {
      tableName = name;
      logger.warn(`No table name provided. Using model name "${name}" as the table name. This can be edited in the model file later.`);
    }

    let filePath = fileHelpers.getModelFilePath(name);
    let templateText = fileHelpers.getModelTemplate();

    templateText = replace(templateText, '<#modelName>', name);
    templateText = replace(templateText, '<#tableName>', tableName);

    fileHelpers.write(filePath, templateText);
  } catch (err) {
    logger.error(`Error creating model file: ${err}`);
  }
}

export function createConn(connInfo) {
  try {
    let filePath = fileHelpers.getConnFilePath(connInfo.name);
    let templateText = fileHelpers.getConnTemplate();

    

    templateText = replace(templateText, '<#host>', connInfo.host);
    templateText = replace(templateText, '<#port>', connInfo.port);
    templateText = replace(templateText, '<#user>', connInfo.user);
    templateText = replace(templateText, '<#password>', connInfo.password);
    templateText = replace(templateText, '<#database>', connInfo.database);

    if (connInfo.aws) {
      templateText = replace(templateText, '<#ssl>', `ssl: 'Amazon RDS',`);
    } else {
      templateText = replace(templateText, '<#ssl>', '');
    }

    if (connInfo.pool) {
      connInfo.poolMin = connInfo.poolMin || 2;
      connInfo.poolMax = connInfo.poolMax || 10;
      templateText = replace(templateText, '<#pool>', `pool: { min: ${connInfo.poolMin}, max: ${connInfo.poolMax} },`);
    } else {
      templateText = replace(templateText, '<#pool>', '');
    }

    fileHelpers.write(filePath, templateText);
    logger.log(`New connection file ${filePath} successfully created`);
  } catch (err) {
    logger.error(`Error creating connection: ${err}`);
  }
}

export function seed(file, connection) {
  setConnection(connection);
  setSeedUmzug();

  return seedUmzug.up(file)
    .then(() => {
      logger.log(`${file} successfully seeded`);
    })
    .catch((err) => {
      logger.error(`Error seeding the database: ${err}`);
    });
}

export function unseed(file, connection) {
  setConnection(connection);
  setSeedUmzug();

  return seedUmzug.down(file)
    .then(() => {
      logger.log(`${file} unseeded`);
    })
    .catch((err) => {
      logger.error(`Error unseeding: ${err}`);
    })
}

export function init() {
  try {
    let cDefault = fileHelpers.getInitFile('default.connection');
    let mTemplate = fileHelpers.getInitFile('migration.template');
    let sTemplate = fileHelpers.getInitFile('seed.template');
    let modelTemplate = fileHelpers.getInitFile('model.template');

    fileHelpers.makeDir('config');
    fileHelpers.makeDir('migrations');
    fileHelpers.makeDir('seeds');
    fileHelpers.makeDir('models');

    fileHelpers.write(fileHelpers.getConfigFilePath('default.js'), cDefault);
    fileHelpers.write(fileHelpers.getConfigFilePath('migration.template'), mTemplate);
    fileHelpers.write(fileHelpers.getConfigFilePath('seed.template'), sTemplate)
    fileHelpers.write(fileHelpers.getConfigFilePath('model.template'), modelTemplate);

    logger.log(`Rhinozug successfully initialized in this directory`);
    logger.log('Installing Rhinozug as a local dependency.  Please wait...');

    // install the local database adapter
    cp.exec('npm install --save rhinozug', (error, stdout, stderr) => {
      if (error) {
        logger.error('Could not install Rhinozug as a local dependency.  Please run "npm install rhinozug -S"');
      } else {
        logger.log('Rhinozug installed as a local dependency');
      }
    });
  } catch (err) {
    logger.error(`Error initializing Rhinozug: ${err}`);
  }
}

export function getConnection(config) {
  return knex.connect(config);
}

function replace(string, find, replace) {
  return string.split(find).join(replace);
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
      tableName: 'rzMigrations'
    },
    migrations: {
      path: fileHelpers.getMigrationsPath()
    }
  });
}

function setSeedUmzug() {
  seedUmzug = new Umzug({
    storage: `${__dirname}/helpers/storage`,
    storageOptions: {
      tableName: 'rzSeeds'
    },
    migrations: {
      path: fileHelpers.getSeedsPath()
    }

  });
}
