import mysqlGetSchema from './mysqlAdapter';
import sqliteGetSchema from './sqliteAdapter';

// should export a function that takes a connection config and uses info in the connection
// to determine what adapter to use. Adpters should return an array of table information objects
// that the knexBuilder knows how to sort and convert into knex code.

export default async function buildMigration(config) {
  let tableInfo;
  if (config.client === 'mysql') {
    tableInfo = await mysqlGetSchema(config);
  } else if (config.client === 'sqlite3') {
    tableInfo = await sqliteGetSchema(config);
  } else if (config.client === 'pg') {
    throw new Error('Postgres support is still in development');
  } else {
    throw new Error(`Unsupported client specified: ${config.client}`);
  }

  const sortedTables = sortTablesByReferences(tableInfo);
  const up = buildSchemaKnex(sortedTables);
  const down = buildTeardownKnex(sortedTables);
  const migrationText = buildMigrationKnex(up, down);
  console.log(migrationText);
}

function sortTablesByReferences(unsortedTables) {
  const sortedTables = [];
  const tableNames = unsortedTables.map((t) => {
    return t.name;
  });
  while (sortedTables.length < tableNames.length) {
    const sortedNames = sortedTables.map((t) => {
      return t.name;
    });
    // get only tables that still haven't been sorted
    const currentUnsortedTables = unsortedTables.filter((t) => {
      return sortedNames.indexOf(t.name) === -1;
    });
    // filter through unsorted tables and find ones without fks to tables that haven't been added
    currentUnsortedTables.forEach((t) => {
      if (tableOnlyReferences(t, sortedNames)) {
        sortedTables.push(t);
      }
    });
  }
  return sortedTables;
}

// true if the given table only has references to the given list of table names or itself, false otherwise
function tableOnlyReferences(tableInfo, tableNames) {
  return tableInfo.columns.reduce((acc, c) => {
    if (tableNames !== null && tableNames !== undefined && tableNames.length > 0) {
      return acc && (
        c.foreignKey === null
        || tableNames.indexOf(c.foreignKey.table) !== -1
        // self-referential FK!
        || tableInfo.name === c.foreignKey.table);
    }
    return acc && c.foreignKey === null;
  }, true);
}

function buildTableKnex(tableData) {
  const output = [];
  output.push(`      .createTableIfNotExists('${tableData.name}', (t) => {`);
  tableData.columns.forEach((c) => {
    const colData = [];
    // build the parameters for the type function
    let typeParams = [`'${c.name}'`];
    if (c.knexType.params !== null) {
      typeParams = [...typeParams, ...c.knexType.params];
    }
    // output the column type
    colData.push(`        t.${c.knexType.type}(${typeParams.join(', ')})`);
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
      let d = c.default;
      if (!/^\d+$/.test(c.default)) {
        d = `'${d}'`;
      }
      colData.push(`          .defaultTo(${d})`);
    }
    // check for foreign keys
    if (c.foreignKey !== null) {
      colData.push(`          .references('${c.foreignKey.column}')`);
      colData.push(`          .inTable('${c.foreignKey.table}')`);
    }
    // join it all together
    const column = `${colData.join('\n')};`;
    // and push it onto the output array
    output.push(column);
  });
  output.push('      })');
  return output.join('\n');
}

function buildSchemaKnex(tables) {
  const output = [];
  output.push('    return connection.schema');
  tables.forEach((t) => {
    output.push(buildTableKnex(t));
  });
  return output.join('\n');
}

function buildTeardownKnex(tables) {
  const output = [];
  output.push('    return connection.schema');
  // tables should be dropped in reverse order
  tables.reverse().forEach((t) => {
    output.push(`      .dropTable('${t.name}')`);
  });
  return output.join('\n');
}

function buildMigrationKnex(upKnex, downKnex) {
  const output = [];
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
