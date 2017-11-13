// doing it any other way seems to cause Umzug to barf
module.exports = function Storage(options) {
  this.options = options || {};
  if (!this.options.storageOptions || !this.options.storageOptions.connection) {
    throw new Error('no connection provided');
  }
  if (!this.options.storageOptions.tableName) {
    this.options.storageOptions.tableName = 'cambio';
  }
  // eslint is mistaking async for the function name here
  // eslint-disable-next-line space-before-function-paren
  this.logMigration = async (migrationName) => {
    await this.createTableIfNotExists();
    const result = await this.options.storageOptions.connection(this.options.storageOptions.tableName).insert({ name: migrationName });
    return result;
  };
  // eslint-disable-next-line space-before-function-paren
  this.unlogMigration = async (migrationName) => {
    await this.createTableIfNotExists();
    const result = await this.options.storageOptions.connection(this.options.storageOptions.tableName).where({ name: migrationName }).del();
    return result;
  };
  // eslint-disable-next-line space-before-function-paren
  this.executed = async () => {
    await this.createTableIfNotExists();
    const rows = await this.options.storageOptions.connection.select('name').from(this.options.storageOptions.tableName);
    return rows.map((r) => {
      return r.name;
    });
  };
  // eslint-disable-next-line space-before-function-paren
  this.createTableIfNotExists = async () => {
    await this.options.storageOptions.connection.schema
      .createTableIfNotExists(this.options.storageOptions.tableName, (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.timestamp('loggedAt');
      })
      .createTableIfNotExists('cambioLock', (table) => {
        table.boolean('lock')
          .defaultTo(true);
        table.timestamp('lockedAt')
          .defaultTo(this.options.storageOptions.connection.fn.now());
      });
  };
};
