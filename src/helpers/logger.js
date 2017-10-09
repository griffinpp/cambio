'use strict'

import colors from 'colors';

export function log(item, silent) {
  if (silent) {
    return;
  }
  console.log(`RZ> ${item}`.white);
}

export function warn(item, silent) {
  if (silent) {
    return;
  }
  console.log(`RZ> ${item}`.yellow);
}

export function error(item) {
  console.error(`RZ> ${item}`.red);
}
