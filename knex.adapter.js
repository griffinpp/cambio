import Knex from 'knex';

export default function connect(connection) {
  if (connection) {
    return Knex(connection);
  }
  throw new Error('a connection object is required.');
}
