import Knex from 'knex';

export default async function getSchema(config) {
  // TODO not sure if this is how I want to get the connection...
  const connection = Knex(config);
  try {
    const tableNames = await getMySqlTableNames(connection);
    const tables = [];
    for (let i = 0; i < tableNames.length; i++) {
      const tableInfo = await getMySqlTableInformation(connection, config.connection.database, tableNames[i]);
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

async function getMySqlTableNames(connection) {
  const result = await connection.raw('show tables');
  const columnName = result[1][0].name;
  return result[0].map((t) => {
    return t[columnName];
  });
}

async function getMySqlTableInformation(connection, dbName, tableName) {
  const rawColumnInfo = await connection.raw(`describe ${tableName}`);
  const rawConstraints = await connection.raw(`select * from information_schema.key_column_usage where TABLE_SCHEMA = '${dbName}' and TABLE_NAME = '${tableName}';`);
  return {
    name: tableName,
    columns: rawColumnInfo[0].map((column) => {
      // this second array contains additional metadata about the column. Maybe not needed?
      // const metadata = rawColumnInfo[1][i];
      const constraints = rawConstraints[0].filter((c) => {
        return c.COLUMN_NAME === column.Field;
      });
      return {
        name: column.Field,
        rawType: column.Type,
        knexType: mySqlParseType(column.Type, column.Extra),
        notNullable: column.Null === 'NO',
        unsigned: checkUnsigned(column.Type),
        unique: false,
        default: column.Default,
        primary: constraints.some((c) => {
          return c.CONSTRAINT_NAME === 'primary';
        }),
        foreignKey: mysqlGetForeignKey(constraints),
      };
    }),
    indexes: {},
  };
}

function mySqlParseType(rawType, extra) {
  /* Possible types in knex:
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
  if (extra !== null && extra.toLowerCase() === 'auto_increment') {
    return {
      type: 'increments',
      params: null,
    };
  }
  const baseType = /[a-z]*/.exec(rawType)[0].toLowerCase();
  switch (baseType) {
    case 'int':
    case 'integer':
      return {
        type: 'integer',
        params: parseParameters(rawType),
      };
    case 'bigint':
      return {
        type: 'bigInteger',
        params: parseParameters(rawType),
      };
    case 'varchar':
      return {
        type: 'string',
        params: parseParameters(rawType),
      };
    case 'char':
      if (rawType.indexOf('(36)') !== -1) {
        return {
          type: 'uuid',
          params: null,
        };
      }
      return {
        type: 'specificType',
        params: convertRawToParams(rawType),
      };
    case 'tinyint':
      if (rawType.indexOf('(1)') !== -1) {
        return {
          type: 'boolean',
          params: null,
        };
      }
      return {
        type: 'integer',
        params: parseParameters(rawType),
      };
    case 'bool':
    case 'boolean':
      return {
        type: 'boolean',
        params: null,
      };
    case 'datetime':
      // if the datetime is higher than default precision, have to use specific type to create it
      if (rawType.indexOf('(') !== -1) {
        return {
          type: 'specificType',
          params: convertRawToParams(rawType),
        };
      }
      return {
        type: 'dateTime',
        params: null,
      };
    case 'time':
      // same for time
      if (rawType.indexOf('(') !== -1) {
        return {
          type: 'specificType',
          params: convertRawToParams(rawType),
        };
      }
      return {
        type: 'time',
        params: null,
      };
    case 'blob':
      return {
        type: 'binary',
        params: null,
      };
    case 'enum': {
      // the second parameter /is/ an array, so we have to wrangle accordingly
      const params = parseParameters(rawType);
      return {
        type: 'enu',
        params: [`[${params.join(',')}]`],
      };
    }
    case 'decimal':
    case 'dec':
      return {
        type: 'decimal',
        params: parseParameters(rawType),
      };
    case 'float':
      return {
        type: 'float',
        params: parseParameters(rawType),
      };
    case 'year':
      return {
        type: 'specificType',
        params: convertRawToParams(rawType),
      };

    case 'text':
    case 'date':
    case 'timestamp':
      return {
        type: baseType,
        params: null,
      };
    case 'binary':
    case 'varbinary':
    case 'real':
    case 'double':
    case 'double precision':
    case 'tinytext':
    case 'mediumtext':
    case 'longtext':
    case 'tinyblob':
    case 'mediumblob':
    case 'longblob':
    case 'bit':
    case 'set':
    case 'smallint':
    case 'mediumint':
      return {
        type: 'specificType',
        params: convertRawToParams(rawType),
      };
    default:
      // we hit something unexpected
      throw new Error(`unexpected type encountered: ${rawType}`);
  }
}

function convertRawToParams(rawType) {
  return [`'${rawType}'`];
}

function checkUnsigned(rawType) {
  return rawType.indexOf('unsigned') !== -1;
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

function mysqlGetForeignKey(constraints) {
  if (constraints === null || constraints === undefined) {
    return null;
  }
  const fk = constraints.find((c) => {
    return c.REFERENCED_TABLE_NAME !== null;
  });
  if (fk !== null && fk !== undefined) {
    return {
      table: fk.REFERENCED_TABLE_NAME,
      column: fk.REFERENCED_COLUMN_NAME,
    };
  }
  return null;
}