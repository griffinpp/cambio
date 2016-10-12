'use strict'

import colors from 'colors';

export function log(item) {
  console.log(`RZ> ${item}`.white);
}

export function warn(item) {
  console.log(`RZ> ${item}`.yellow);
}

export function error(item) {
  console.error(`RZ> ${item}`.red);
}
