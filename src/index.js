import cp from 'child_process';
import Umzug from 'umzug';
import * as fileHelpers from './helpers/fileHelper';
import * as logger from './helpers/logger';
import connect from './knex.adapter';

let migrationUmzug;

let seedUmzug;

function printList(list) {
  list.forEach((item, i) => {
    logger.log(`${i + 1}: ${item.file}`);
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

export async function up(to, connection, silent) {
  setConnection(connection);
  setMigrationUmzug();

  try {
    if (to && to !== null) {
      await migrationUmzug.up({ to });
      logger.log(`Migrations up to ${to} complete`, silent);
      return;
    }
    await migrationUmzug.up();
    logger.log('All migrations complete', silent);
    return;
  } catch (e) {
    logger.error(`Error running up migration(s): ${e}`);
  }
}

export async function down(to, connection, silent) {
  setConnection(connection);
  setMigrationUmzug();

  try {
    if (to && to !== null) {
      await migrationUmzug.down({ to });
      logger.log(`Migrations down to ${to} complete`, silent);
      return;
    }
    await migrationUmzug.down();
    logger.log('Latest migration down complete', silent);
    return;
  } catch (e) {
    logger.error(`Error running down migration(s): ${e}`);
  }
}

export async function listExecuted(connection) {
  setConnection(connection);
  setMigrationUmzug();

  try {
    const list = await migrationUmzug.executed();
    logger.log('Executed Migrations');
    printList(list);
    logger.log('\n');
  } catch (e) {
    logger.error(`Error listing migrations: ${e}`);
  }
}

export function listPending(connection) {
  setConnection(connection);
  setMigrationUmzug();

  try {
    const list = migrationUmzug.pending();
    printList(list);
    logger.log('\n');
  } catch (e) {
    logger.error(`Error listing migrations: ${e}`);
  }
}

export async function listAll(connection) {
  setConnection(connection);
  setMigrationUmzug();

  try {
    const eList = await migrationUmzug.executed();
    const pList = await migrationUmzug.pending();
    logger.log('Executed Migrations:');
    printList(eList);
    logger.log('');
    logger.log('Pending Migrations');
    printList(pList);
    logger.log('');
  } catch (e) {
    logger.error(`Error listing migrations: ${e}`);
  }
}

export async function listExecutedSeeds(connection) {
  setConnection(connection);
  setSeedUmzug();

  try {
    const list = await seedUmzug.executed();
    logger.log('Applied Seeds:');
    printList(list);
    logger.log('\n');
  } catch (e) {
    logger.error(`Error listing seeds: ${e}`);
  }
}

export async function listPendingSeeds(connection) {
  setConnection(connection);
  setSeedUmzug();

  try {
    const list = await seedUmzug.pending();
    logger.log('Unapplied Seeds:');
    printList(list);
    logger.log('\n');
  } catch (e) {
    logger.error(`Error listing seeds: ${e}`);
  }
}

export async function listAllSeeds(connection) {
  setConnection(connection);
  setSeedUmzug();

  try {
    const aList = await seedUmzug.executed();
    const uList = await seedUmzug.pending();
    logger.log('Applied Seeds:');
    printList(aList);
    logger.log('');
    logger.log('Unapplied Seeds:');
    printList(uList);
    logger.log('');
  } catch (e) {
    logger.error(`Error listing seeds: ${e}`);
  }
}

export function listConnections() {
  logger.log('Available Connections (for use with the -c option): ');
  fileHelpers.getConnections().forEach((c, i) => {
    logger.log(`${i + 1}: ${c}`);
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

export async function seed(file, connection, silent) {
  setConnection(connection);
  setSeedUmzug();

  try {
    await seedUmzug.up(file);
    logger.log(`${file} successfully seeded`, silent);
  } catch (e) {
    logger.error(`Error seeding the database: ${e}`);
  }
}

export async function unseed(file, connection, silent) {
  setConnection(connection);
  setSeedUmzug();

  try {
    await seedUmzug.down(file);
    logger.log(`${file} unseeded`, silent);
  } catch (e) {
    logger.error(`Error unseeding: ${e}`);
  }
}

export async function rebuildDb(connection, silent) {
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
  try {
    try {
      await knex.raw(`DROP DATABASE ${dbName}`);
      logger.log(`Dropped ${dbName} database`, silent);
    } catch (e) {
      logger.warn(`Database ${dbName} not found. Creating.`);
    }
    await knex.raw(`CREATE DATABASE ${dbName}`);
    logger.log(`Created ${dbName} database`, silent);
    knex.destroy();
    config.connection.database = dbName;
    knex = getConnection(config);
    await up(null, connection);
    knex.destroy();
  } catch (e) {
    logger.error(`Error rebuilding database: ${e}`);
    knex.destroy();
  }
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

    logger.log('Cambio folders and templates successfully initialized in this directory');
    // logger.log('Installing Cambio as a local dependency.  Please wait...');

    // install the local database adapter
    // cp.exec('npm install --save cambio', (error) => {
    //   if (error) {
    //     logger.error('Could not install Cambio as a local dependency.  Please run "npm install cambio -S"');
    //   } else {
    //     logger.log('Cambio installed as a local dependency');
    //   }
    // });
  } catch (err) {
    logger.error(`Error initializing Cambio: ${err}`);
  }
}

export function getConnection(config) {
  return connect(config);
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
      tableName: 'cambioMigrations',
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
      tableName: 'cambioSeeds',
    },
    migrations: {
      path: fileHelpers.getSeedsPath(),
    },
  });
}
