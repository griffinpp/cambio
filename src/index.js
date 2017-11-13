import Umzug from 'umzug';
import * as fileHelpers from './helpers/fileHelper';
import * as logger from './helpers/logger';
import connect from './knex.adapter';

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

export async function up(to, connectionName, silent) {
  const connection = getConnectionFromName(connectionName);
  const mUmzug = getMigrationUmzug(connection);
  try {
    if (to && to !== null) {
      await mUmzug.up({ to });
      logger.log(`Migrations up to ${to} complete`, silent);
      return;
    }
    await mUmzug.up();
    logger.log('All migrations complete', silent);
    return;
  } catch (e) {
    logger.error(`Error running up migration(s): ${e.stack}`);
  } finally {
    connection.destroy();
  }
}

export async function down(to, connectionName, silent) {
  const connection = getConnectionFromName(connectionName);
  const mUmzug = getMigrationUmzug(connection);
  try {
    if (to && to !== null) {
      await mUmzug.down({ to });
      logger.log(`Migrations down to ${to} complete`, silent);
      return;
    }
    await mUmzug.down();
    logger.log('Latest migration down complete', silent);
    return;
  } catch (e) {
    logger.error(`Error running down migration(s): ${e}`);
  } finally {
    connection.destroy();
  }
}

export async function listExecuted(connectionName) {
  const connection = getConnectionFromName(connectionName);
  const mUmzug = getMigrationUmzug(connection);

  try {
    const list = await mUmzug.executed();
    logger.log('Executed Migrations');
    printList(list);
    logger.log('\n');
  } catch (e) {
    logger.error(`Error listing migrations: ${e}`);
  } finally {
    connection.destroy();
  }
}

export function listPending(connectionName) {
  const connection = getConnectionFromName(connectionName);
  const mUmzug = getMigrationUmzug(connection);

  try {
    const list = mUmzug.pending();
    printList(list);
    logger.log('\n');
  } catch (e) {
    logger.error(`Error listing migrations: ${e}`);
  } finally {
    connection.destroy();
  }
}

export async function listAll(connectionName) {
  const connection = getConnectionFromName(connectionName);
  const mUmzug = getMigrationUmzug(connection);

  try {
    const eList = await mUmzug.executed();
    const pList = await mUmzug.pending();
    logger.log('Executed Migrations:');
    printList(eList);
    logger.log('');
    logger.log('Pending Migrations');
    printList(pList);
    logger.log('');
  } catch (e) {
    logger.error(`Error listing migrations: ${e}`);
  } finally {
    connection.destroy();
  }
}

export async function listExecutedSeeds(connectionName) {
  const connection = getConnectionFromName(connectionName);
  const sUmzug = getSeedUmzug(connection);

  try {
    const list = await sUmzug.executed();
    logger.log('Applied Seeds:');
    printList(list);
    logger.log('\n');
  } catch (e) {
    logger.error(`Error listing seeds: ${e}`);
  } finally {
    connection.destroy();
  }
}

export async function listPendingSeeds(connectionName) {
  const connection = getConnectionFromName(connectionName);
  const sUmzug = getSeedUmzug(connection);

  try {
    const list = await sUmzug.pending();
    logger.log('Unapplied Seeds:');
    printList(list);
    logger.log('\n');
  } catch (e) {
    logger.error(`Error listing seeds: ${e}`);
  } finally {
    connection.destroy();
  }
}

export async function listAllSeeds(connectionName) {
  const connection = getConnectionFromName(connectionName);
  const sUmzug = getSeedUmzug(connection);

  try {
    const aList = await sUmzug.executed();
    const uList = await sUmzug.pending();
    logger.log('Applied Seeds:');
    printList(aList);
    logger.log('');
    logger.log('Unapplied Seeds:');
    printList(uList);
    logger.log('');
  } catch (e) {
    logger.error(`Error listing seeds: ${e}`);
  } finally {
    connection.destroy();
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

export async function seed(file, connectionName, silent) {
  const connection = getConnectionFromName(connectionName);
  const sUmzug = getSeedUmzug(connection);

  try {
    await sUmzug.up(file);
    logger.log(`${file} successfully seeded`, silent);
  } catch (e) {
    logger.error(`Error seeding the database: ${e}`);
  } finally {
    connection.destroy();
  }
}

export async function unseed(file, connectionName, silent) {
  const connection = getConnectionFromName(connectionName);
  const sUmzug = getSeedUmzug(connection);

  try {
    await sUmzug.down(file);
    logger.log(`${file} unseeded`, silent);
  } catch (e) {
    logger.error(`Error unseeding: ${e}`);
  } finally {
    connection.destroy();
  }
}

export async function rebuildDb(connectionName, silent) {
  if (!connectionName) {
    // eslint-disable-next-line
    connectionName = 'default';
  }
  const configFile = fileHelpers.getConfigFilePath(`${connectionName}.js`);
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
    // destroy and recreate the connection now that the db has been created
    knex.destroy();
    config.connection.database = dbName;
    knex = getConnection(config);
    await up(null, connectionName);
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
  } catch (err) {
    logger.error(`Error initializing Cambio: ${err}`);
  }
}

export function getConnection(config) {
  return connect(config);
}

function getConnectionFromName(connectionName) {
  if (!connectionName) {
    // eslint-disable-next-line
    connectionName = 'default';
  }
  const configFile = fileHelpers.getConfigFilePath(`${connectionName}.js`);
  // eslint-disable-next-line
  const config = require(configFile);
  return getConnection(config);
}

function replace(string, find, rep) {
  return string.split(find).join(rep);
}

function getMigrationUmzug(activeConnection) {
  return new Umzug({
    storage: `${__dirname}/objects/CustomStorage`,
    storageOptions: {
      tableName: 'cambioMigrations',
      connection: activeConnection,
    },
    migrations: {
      params: [activeConnection],
      path: fileHelpers.getMigrationsPath(),
    },
  });
}

function getSeedUmzug(activeConnection) {
  return new Umzug({
    storage: `${__dirname}/helpers/storage`,
    storageOptions: {
      tableName: 'cambioSeeds',
      connection: activeConnection,
    },
    migrations: {
      params: [activeConnection],
      path: fileHelpers.getSeedsPath(),
    },
  });
}
