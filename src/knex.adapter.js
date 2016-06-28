'use strict';

import Knex from 'knex';

export function connect(connection) {
  if(connection) {
    return Knex(connection);
  } else {
    throw new Error('a connection object is required.');
  }
}