'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = log;
exports.warn = warn;
exports.error = error;

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function log(item, silent) {
  if (silent) {
    return;
  }
  console.log(('CO> ' + item).white);
} // colors works by just being imported
// eslint-disable-next-line
function warn(item, silent) {
  if (silent) {
    return;
  }
  console.log(('CO> ' + item).yellow);
}

function error(item) {
  console.error(('CO> ' + item).red);
}