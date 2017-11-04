"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log = log;
exports.warn = warn;
exports.error = error;
function log(item, silent) {
  if (silent) {
    return;
  }
  console.log(("RZ> " + item).white);
}

function warn(item, silent) {
  if (silent) {
    return;
  }
  console.log(("RZ> " + item).yellow);
}

function error(item) {
  console.error(("RZ> " + item).red);
}