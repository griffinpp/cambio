import buildMigration from './src/migrationBuilder/migrationBuilder';
// eslint-disable-next-line
const mysqlConfig = {
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'RhinoDB',
    charset: 'utf8mb4',
    timezone: '0000',
  },
  pool: {
    min: 2,
    max: 10,
  },
};

// eslint-disable-next-line
const sqliteConfig = {
  client: 'sqlite3',
  connection: {
    filename: './test.sqlite',
  },
  useNullAsDefault: true,
};

run();

async function run() {
  try {
    await buildMigration(sqliteConfig);
  } catch (e) {
    console.log(e.stack);
  }
}
