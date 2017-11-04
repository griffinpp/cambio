'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = connect;

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function connect(connection) {
  if (connection) {
    return (0, _knex2.default)(connection);
  }
  throw new Error('a connection object is required.');
}