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

function log(item) {
  console.log(('RZ> ' + item).white);
}

function warn(item) {
  console.log(('RZ> ' + item).yellow);
}

function error(item) {
  console.error(('RZ> ' + item).red);
}