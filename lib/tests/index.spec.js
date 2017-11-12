'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _proxyquire = require('proxyquire');

var _proxyquire2 = _interopRequireDefault(_proxyquire);

var _promiseHelper = require('./promiseHelper');

var _promiseHelper2 = _interopRequireDefault(_promiseHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fhStub = {
  getDbDir: sinon.stub().returns('/user/repos/testProject/db'),
  getMigrationsPath: sinon.stub().returns('/user/repos/testProject/db/migrations'),
  getSeedsPath: sinon.stub().returns('/user/repos/testProject/db/seeds'),
  getMigrationTemplate: sinon.stub().returns('migration template contents'),
  getModelTemplate: sinon.stub().returns('<#modelName>:<#tableName>'),
  getConnTemplate: sinon.stub().returns('<#host>:<#port>:<#database>:<#user>:<#password>:<#ssl>:<#pool>'),
  getSeedTemplate: sinon.stub().returns('seed template contents'),
  getMigrationFilePath: function getMigrationFilePath(name) {
    return 'migration/20160101-' + name + '.js';
  },
  getSeedFilePath: function getSeedFilePath(name) {
    return 'seed/20160101-' + name + '.js';
  },
  getConfigFilePath: function getConfigFilePath(name) {
    return 'config/' + name;
  },
  getModelFilePath: function getModelFilePath(name) {
    return 'model/' + name + '.model.js';
  },
  getConnFilePath: function getConnFilePath(name) {
    return 'config/' + name + '.js';
  },
  getInitFile: sinon.stub().returns('init file contents'),
  read: sinon.stub().returns('fake contents'),
  write: sinon.stub(),
  makeDir: sinon.stub()
};

var error = new Error('derp!');

var cpStub = {
  exec: sinon.stub()
};

var umzugStub = function umzugStub() {};

// create local stubs so we can monitor what's going on
var up = sinon.stub().returns(_promise2.default.resolve());
var down = sinon.stub().returns(_promise2.default.resolve());

umzugStub.prototype = {
  up: up,
  down: down
};

var loggerStub = {
  log: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub()
};

var sut = (0, _proxyquire2.default)('../index', {
  './helpers/fileHelper': fhStub,
  // eslint-disable-next-line
  'umzug': umzugStub,
  // eslint-disable-next-line
  'child_process': cpStub,
  './helpers/logger': loggerStub
});

describe('cambio module', function () {
  beforeEach(function () {
    loggerStub.error.reset();
    loggerStub.warn.reset();
    loggerStub.error.reset();
  });

  describe('.createMigration', function () {
    describe('when there is not an error', function () {
      it('should log the creation of the migration', function () {
        sut.createMigration('testName');
        expect(loggerStub.log.called).to.equal(true);
      });

      describe('when a name is specified', function () {
        it('should create a new copy of the migration template in the migrations directory using the name given as the legible part of the filename', function () {
          sut.createMigration('testName');
          expect(fhStub.write.calledWith('migration/20160101-testName.js', 'migration template contents')).to.equal(true);
        });
      });

      describe('when a name is not specified', function () {
        it('should create a new copy of the migration template in the migrations directory using "unnamed" as the legible part of the filename', function () {
          sut.createMigration();
          expect(fhStub.write.calledWith('migration/20160101-unnamed.js', 'migration template contents')).to.equal(true);
        });
      });
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        fhStub.write.throws(error);
      });

      it('should log the error', function () {
        sut.createMigration('testName');
        expect(loggerStub.error.called).to.equal(true);
      });

      afterEach(function () {
        fhStub.write = sinon.stub();
      });
    });
  });

  describe('.up()', function () {
    beforeEach(function () {
      up.reset();
      up.returns(_promise2.default.resolve());
    });

    describe('when there is not an error', function () {
      it('should set the connection', function (done) {
        (0, _promiseHelper2.default)(sut.up(), function () {
          expect(process.env.connection).not.to.equal(null);
        }, done);
      });

      it('should log the completion of the event', function (done) {
        (0, _promiseHelper2.default)(sut.up(), function () {
          expect(loggerStub.log.called).to.equal(true);
        }, done);
      });

      describe('when a file is specified', function () {
        it('should run migrations up to the specified file', function (done) {
          (0, _promiseHelper2.default)(sut.up('testFile.js'), function () {
            expect(up.calledWith({ to: 'testFile.js' })).to.equal(true);
          }, done);
        });
      });

      describe('when a file is not specified', function () {
        it('should run all migrations up the most current file', function (done) {
          (0, _promiseHelper2.default)(sut.up(), function () {
            expect(up.called).to.equal(true);
          }, done);
        });
      });
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        up.returns(_promise2.default.reject());
      });

      it('should log the error', function (done) {
        (0, _promiseHelper2.default)(sut.up(), function () {
          expect(loggerStub.error.called).to.equal(true);
        }, done);
      });
    });
  });

  describe('.down()', function () {
    beforeEach(function () {
      down.reset();
      down.returns(_promise2.default.resolve());
    });

    describe('when there is not an error', function () {
      it('should set the connection', function (done) {
        (0, _promiseHelper2.default)(sut.down(), function () {
          expect(process.env.connection).not.to.equal(null);
        }, done);
      });

      it('should log the completion of the event', function (done) {
        (0, _promiseHelper2.default)(sut.down(), function () {
          expect(loggerStub.log.called).to.equal(true);
        }, done);
      });

      describe('when a file is specified', function () {
        it('should run migrations down to the specified file', function (done) {
          // done(new Error('test error'));
          (0, _promiseHelper2.default)(sut.down('testFile.js'), function () {
            expect(down.calledWith({ to: 'testFile.js' })).to.equal(true);
          }, done);
        });
      });

      describe('when a file is not specified', function () {
        it('should run down the last migration that was run up', function (done) {
          (0, _promiseHelper2.default)(sut.down(), function () {
            expect(down.called).to.equal(true);
          }, done);
        });
      });
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        down.returns(_promise2.default.reject());
      });

      it('should log the error', function (done) {
        (0, _promiseHelper2.default)(sut.down(), function () {
          expect(loggerStub.error.called).to.equal(true);
        }, done);
      });
    });
  });

  describe('.createSeed()', function () {
    describe('when there is not an error', function () {
      it('should log the creation of the seed', function () {
        sut.createSeed('testName');
        expect(loggerStub.log.called).to.equal(true);
      });

      describe('when a name is specified', function () {
        it('should create a new copy of the seed template in the seeds directory using the name given as the legible part of the filename', function () {
          sut.createSeed('testName');
          expect(fhStub.write.calledWith('seed/20160101-testName.js', 'seed template contents')).to.equal(true);
        });
      });

      describe('when a name is not specified', function () {
        it('should create a new copy of the seed template in the seeds directory using "unnamed" as the legible part of the filename', function () {
          sut.createSeed();
          expect(fhStub.write.calledWith('seed/20160101-unnamed.js', 'seed template contents')).to.equal(true);
        });
      });
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        fhStub.write.throws(error);
      });

      it('should log the error', function () {
        sut.createSeed('testName');
        expect(loggerStub.error.called).to.equal(true);
      });

      afterEach(function () {
        fhStub.write = sinon.stub();
      });
    });
  });

  describe('.createModel()', function () {
    describe('when there is not a general error', function () {
      it('should log the creation of the model', function () {
        sut.createModel('Item', 'Items');
        expect(loggerStub.log.called).to.equal(true);
      });

      describe('when no table name is specified', function () {
        it('should use the model name as the table name', function () {
          sut.createModel('Item');
          expect(fhStub.write.calledWith('model/Item.model.js', 'Item:Item'));
        });

        it('should warn that the model name is being used as the table name', function () {
          sut.createModel('Item');
          expect(loggerStub.warn.called).to.equal(true);
        });
      });

      describe('when no model name is specified', function () {
        it('should log an error', function () {
          sut.createModel();
          expect(loggerStub.error.called).to.equal(true);
        });
      });
    });

    describe('when there is an error not related to provided names', function () {
      beforeEach(function () {
        fhStub.write.throws(error);
      });

      it('should log the error', function () {
        sut.createModel('Item', 'Items');
        expect(loggerStub.error.called).to.equal(true);
      });

      afterEach(function () {
        fhStub.write = sinon.stub();
      });
    });
  });

  describe('.createConn()', function () {
    var info = {
      name: 'Test',
      host: 'localhost',
      port: 1234,
      user: 'root',
      password: '',
      database: 'Test',
      aws: false,
      pool: false
    };

    describe('when there is not an error', function () {
      it('should log the creation of the connection', function () {
        sut.createConn(info);
        expect(loggerStub.log.called).to.equal(true);
      });

      it('should use the name provided as the connection name', function () {
        sut.createConn(info);
        expect(fhStub.write.calledWith('config/Test.js')).to.equal(true);
      });

      it('should insert the provided data into the appropriate places in the template', function () {
        sut.createConn(info);
        expect(fhStub.write.firstCall.args[1]).to.equal('localhost:1234:Test:root:::');
      });

      describe('when an AWS connection is specified', function () {
        before(function () {
          fhStub.write.reset();
          info.aws = true;
        });

        it('should specify an ssl connection of type Amazon RDS', function () {
          sut.createConn(info);
          expect(fhStub.write.firstCall.args[1]).to.equal('localhost:1234:Test:root::ssl: \'Amazon RDS\',:');
        });

        after(function () {
          info.aws = false;
        });
      });

      describe('when a connection pool is specified', function () {
        before(function () {
          fhStub.write.reset();
          info.pool = true;
          info.poolMin = 3;
          info.poolMax = 13;
        });

        it('should specify the pool information using the max and min provided', function () {
          sut.createConn(info);
          expect(fhStub.write.firstCall.args[1]).to.equal('localhost:1234:Test:root:::pool: { min: 3, max: 13 },');
        });

        after(function () {
          info.pool = false;
        });
      });
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        fhStub.write.throws(error);
      });

      it('should log the error', function () {
        sut.createConn('Item', 'Items');
        expect(loggerStub.error.called).to.equal(true);
      });

      afterEach(function () {
        fhStub.write = sinon.stub();
      });
    });
  });

  describe('.seed()', function () {
    beforeEach(function () {
      up.reset();
      up.returns(_promise2.default.resolve());
    });

    describe('when there is not an error', function () {
      it('should set the connection', function (done) {
        (0, _promiseHelper2.default)(sut.seed(), function () {
          expect(process.env.connection).not.to.equal(null);
        }, done);
      });

      it('should log the completion of the event', function (done) {
        (0, _promiseHelper2.default)(sut.seed(), function () {
          expect(loggerStub.log.called).to.equal(true);
        }, done);
      });

      it('should run Umzug.up with the specified file', function () {
        sut.seed('file');
        expect(up.calledWith('file')).to.equal(true);
      });
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        up.returns(_promise2.default.reject());
      });

      it('should log the error', function (done) {
        (0, _promiseHelper2.default)(sut.seed(), function () {
          expect(loggerStub.error.called).to.equal(true);
        }, done);
      });
    });
  });

  describe('.unseed()', function () {
    beforeEach(function () {
      down.reset();
      down.returns(_promise2.default.resolve());
    });

    describe('when there is not an error', function () {
      it('should set the connection', function (done) {
        (0, _promiseHelper2.default)(sut.unseed(), function () {
          expect(process.env.connection).not.to.equal(null);
        }, done);
      });

      it('should log the completion of the event', function (done) {
        (0, _promiseHelper2.default)(sut.unseed(), function () {
          expect(loggerStub.log.called).to.equal(true);
        }, done);
      });

      it('should run Umzug.down with the specified file', function (done) {
        (0, _promiseHelper2.default)(sut.unseed('file'), function () {
          expect(down.calledWith('file')).to.equal(true);
        }, done);
      });
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        down.returns(_promise2.default.reject());
      });

      it('should log the error', function (done) {
        (0, _promiseHelper2.default)(sut.unseed(), function () {
          expect(loggerStub.error.called).to.equal(true);
        }, done);
      });
    });
  });

  describe('.init()', function () {
    describe('when there is not an error', function () {
      it('should create a config directory', function () {
        sut.init();
        expect(fhStub.makeDir.calledWith('config')).to.equal(true);
      });

      it('should create a migrations directory', function () {
        sut.init();
        expect(fhStub.makeDir.calledWith('migrations')).to.equal(true);
      });

      it('should create a seeds directory', function () {
        sut.init();
        expect(fhStub.makeDir.calledWith('seeds')).to.equal(true);
      });

      it('should copy the default connection config file into the new config folder', function () {
        sut.init();
        expect(fhStub.getInitFile.calledWith('default.connection')).to.equal(true);
        expect(fhStub.write.calledWith('config/default.js', 'init file contents')).to.equal(true);
      });

      it('should copy the migration template into the new config folder', function () {
        sut.init();
        expect(fhStub.getInitFile.calledWith('migration.template')).to.equal(true);
        expect(fhStub.write.calledWith('config/migration.template', 'init file contents')).to.equal(true);
      });

      it('should copy the seed template into the new config folder', function () {
        sut.init();
        expect(fhStub.getInitFile.calledWith('seed.template')).to.equal(true);
        expect(fhStub.write.calledWith('config/seed.template', 'init file contents')).to.equal(true);
      });

      it('should npm install the cambio connection module', function () {
        sut.init();
        expect(cpStub.exec.calledWith('npm install --save cambio')).to.equal(true);
      });
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        fhStub.write.throws(error);
      });

      it('should log the error', function () {
        sut.init();
        expect(loggerStub.error.called).to.equal(true);
      });

      afterEach(function () {
        fhStub.write = sinon.stub();
      });
    });
  });
});