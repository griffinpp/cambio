// colors works by just being imported
// eslint-disable-next-line
import colors from 'colors';

export function log(item, silent) {
  if (silent) {
    return;
  }
  console.log(`CO> ${item}`.white);
}

export function warn(item, silent) {
  if (silent) {
    return;
  }
  console.log(`CO> ${item}`.yellow);
}

export function error(item) {
  console.error(`CO> ${item}`.red);
}
