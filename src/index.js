'use strict';

import * as knex from './knex.adapter';

export function getConnection(config) {
  return knex.connect(config);
}
