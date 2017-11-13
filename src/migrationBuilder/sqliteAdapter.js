import Knex from 'knex';

export default async function getSchema(config) {
  // TODO not sure if this is how I want to get the connection...
  const connection = Knex(config);
  try {
    const tableNames = await getSqliteTableNames(connection);
    const tables = [];
    for (let i = 0; i < tableNames.length; i++) {
      const tableInfo = await getSqliteTableInformation(connection, tableNames[i]);
      tables.push(tableInfo);
    }
    connection.destroy();
    return tables;
  } catch (e) {
    console.log(e.stack);
    connection.destroy();
    throw e;
  }
}

async function getSqliteTableNames(connection) {
  const result = await connection.raw(`
    select name from sqlite_master
    where type='table'
    and name not like 'sqlite_%'
    order by name;
  `);
  return result.map((t) => {
    return t.name;
  });
}

async function getSqliteTableInformation(connection, tableName) {
  const rawColumnInfo = await connection.raw(`pragma table_info(${tableName})`);
  const rawForeigns = await connection.raw(`pragma foreign_key_list(${tableName})`);
  const rawAutoIncrement = await connection.raw(`SELECT 1 FROM sqlite_master WHERE tbl_name="${tableName}" and sql like '%autoincrement%';`);
  return {
    name: tableName,
    columns: rawColumnInfo.map((column) => {
      const fk = rawForeigns.filter((c) => {
        return c.from === column.name;
      });
      const foreignKey = fk.length === 0 ? null : { table: fk[0].table, column: fk[0].to };

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
        foreignKey,
      };
    }),
    indexes: {},
  };
}

function sqliteParseType(rawType, pk, tableAutoIncrement) {
  /* note that sqlite doesn't actually care that much about types and will even let you
    make up types when you're creating a table, so something like:

    CREATE TABLE `myTable` (
      `id` INTEGER,
      `someColumn` DERP
    );
    is completely valid, so we do our best to guess at likely column types based on sqlite docs and what
    knex generates in the first place...

   Types that have functions in knex:
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
      params: null,
    };
  }
  const baseType = /[a-z]*/.exec(rawType)[0].toLowerCase();
  switch (baseType) {
    case 'int':
    case 'integer':
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
      return {
        type: 'integer',
        params: null,
      };
    case 'bigint':
      return {
        type: 'bigInteger',
        params: null,
      };
    case 'char':
    case 'varchar':
    case 'text':
    case 'tinytext':
    case 'mediumtext':
    case 'longtext':
      return {
        type: 'string',
        params: parseParameters(rawType),
      };
    case 'bool':
    case 'boolean':
      return {
        type: 'boolean',
        params: null,
      };
    case 'year':
    case 'date':
      return {
        type: 'date',
        params: null,
      };
    case 'datetime':
      return {
        type: 'dateTime',
        params: null,
      };
    case 'time':
    case 'timestamp':
      return {
        type: 'time',
        params: null,
      };
    case 'blob':
    case 'tinyblob':
    case 'mediumblob':
    case 'longblob':
    case 'binary':
    case 'varbinary':
      return {
        type: 'binary',
        params: null,
      };
    case 'decimal':
    case 'dec':
      return {
        type: 'decimal',
        params: parseParameters(rawType),
      };
    case 'float':
    case 'real':
    case 'double':
    case 'double precision':
      return {
        type: 'float',
        params: parseParameters(rawType),
      };
    default:
      // we hit something unexpected, return a string type, anything can be stored here anyway...
      return {
        type: 'string',
        params: null,
      };
  }
}

function parseParameters(str) {
  // no parameters
  if (str.indexOf('(') === -1) {
    return null;
  }
  // get the string between parentheses, remove spaces, then split on commas
  return str.split('(')[1]
    .split(')')[0]
    .replace(' ', '')
    .split(',');
}
