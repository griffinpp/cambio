import buildMigration from './src/migrationBuilder/migrationBuilder';

const config = {
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

run();

async function run() {
  try {
    await buildMigration(config);
  } catch (e) {
    console.log(e.stack);
  }
}
