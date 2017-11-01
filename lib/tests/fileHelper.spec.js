'use strict';

var _proxyquire = require('proxyquire');

var _proxyquire2 = _interopRequireDefault(_proxyquire);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var error = new Error('derp!');

var fsStub = {
  readFileSync: sinon.stub().returns('contents'),
  writeFileSync: sinon.stub().returns('ok'),
  mkdirSync: sinon.stub().returns('ok'),
  readdirSync: sinon.stub(),
  statSync: sinon.stub().returns({
    isDirectory: sinon.stub().returns(true)
  })
};

var loggerStub = {
  log: sinon.stub(),
  warning: sinon.stub(),
  error: sinon.stub()
};

var sut = (0, _proxyquire2.default)('../helpers/fileHelper', {
  'fs': fsStub,
  './logger': loggerStub
});

/* setupReadDirSuccess and setupReadDirFail imagine the following dir structure:
   package.json
   /node_modules
   /src
     +- /db
       +- /migrations // assumed not to exist in the failure case
       +- /config // assumed not to exist in the failure case
       +- /seeds // assumed not to exist in the failure case
       +- /models // assumed not to exist in the failure case
     +- /server
     +- /client
   /lib

   Both assume that process.cwd() is the /src folder
 */

function setupReadDirSuccess() {
  fsStub.readdirSync.reset();
  fsStub.readdirSync.onCall(0).returns(['db', 'server', 'client']);
  fsStub.readdirSync.onCall(1).returns(['node_modules', 'src', 'lib', 'package.json']);

  // at this point, the search for the migrations folder should begin
  fsStub.readdirSync.onCall(2).returns(['node_modules', 'src', 'lib']);
  fsStub.readdirSync.onCall(3).returns(['db', 'server', 'client']);
  fsStub.readdirSync.onCall(4).returns(['migrations', 'config', 'seeds', 'models']);
  fsStub.readdirSync.returns([]);
}

function setupReadDirFail() {
  fsStub.readdirSync.reset();
  fsStub.readdirSync.onCall(0).returns(['db', 'server', 'client']);
  fsStub.readdirSync.onCall(1).returns(['node_modules', 'src', 'lib', 'package.json']);

  // now the search for the migrations folder begins
  fsStub.readdirSync.onCall(2).returns(['node_modules', 'src', 'lib']);
  fsStub.readdirSync.onCall(3).returns(['db', 'server', 'client']);
  // be sure to overwrite behavior for the fourth call, or it will remain in place
  fsStub.readdirSync.onCall(4).returns([]);

  // no more subdirectories in the directory tree, i.e. there is no "migrations" dir
  fsStub.readdirSync.returns([]);
}

function setupNoPackage() {
  fsStub.readdirSync = sinon.stub();
  fsStub.readdirSync.onCall(0).returns(['db', 'server', 'client']);
  fsStub.readdirSync.onCall(1).returns(['src', 'lib']);
  fsStub.readdirSync.onCall(2).returns(['testProject']);
  fsStub.readdirSync.onCall(3).returns(['repos']);
  fsStub.readdirSync.onCall(4).returns(['user']);
}

describe('fileHelper module', function () {

  beforeEach(function () {
    loggerStub.log.reset();
    loggerStub.warning.reset();
    loggerStub.error.reset();

    setupReadDirSuccess();
  });

  describe('.getDbDir', function () {
    describe('when a package.json is found in the project', function () {
      describe('when cambio has been initialized in the project', function () {
        beforeEach(setupReadDirSuccess);

        it('should return the directory where cambio was initialized', function () {
          var result = sut.getDbDir();

          // package.json is not "found" in the first call to fs.readdirSync, so it should go down a level
          expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db'].join('/')));
        });
      });

      describe('when cambio has not been initialized in the project', function () {
        beforeEach(setupReadDirFail);

        it('should throw an error', function () {
          expect(sut.getDbDir.bind(sut)).to.throw;
        });
      });
    });
    describe('when the project has no package.json', function () {
      beforeEach(setupNoPackage);

      it('should throw an error', function () {
        expect(sut.getDbDir.bind(sut)).to.throw;
      });
    });
  });

  describe('.read()', function () {
    it('should return a string of the contents of the file', function () {
      // just verifying that the correct fs function is called
      var result = sut.read('fakeFile.txt');
      expect(fsStub.readFileSync.calledWith('fakeFile.txt')).to.be.true;
      expect(result).to.equal('contents');
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        fsStub.readFileSync.throws(error);
      });

      it('should log the error', function () {
        var result = sut.read('fakeFile.txt');
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(function () {
        fsStub.readFileSync = sinon.stub().returns('contents');
      });
    });
  });

  describe('.write()', function () {
    it('should write the string to the specified file', function () {
      // again, just verifying that the correct fs function is called
      sut.write('fakeFile.txt', 'contents');
      expect(fsStub.writeFileSync.calledWith('fakeFile.txt', 'contents')).to.be.true;
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        fsStub.writeFileSync.throws(error);
      });

      it('should log the error', function () {
        var result = sut.write('fakeFile.txt', 'contents');
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(function () {
        fsStub.writeFileSync = sinon.stub().returns('ok');
      });
    });
  });

  describe('.makeDir()', function () {
    it('should create a directory with the specified name in the current working directory', function () {
      sut.makeDir('fakeDir');
      expect(fsStub.mkdirSync.calledWith('./fakeDir')).to.be.true;
    });

    describe('when there is an error', function () {
      beforeEach(function () {
        fsStub.mkdirSync.throws(error);
      });

      it('should log the error', function () {
        var result = sut.makeDir('./fakeDir');
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(function () {
        fsStub.mkdirSync = sinon.stub().returns('ok');
      });
    });
  });

  describe('.getMigrationsPath()', function () {
    it('should return a path to the "migrations" directory in the directory where "cambio init" was called', function () {
      var result = sut.getMigrationsPath();
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'migrations'].join('/')));
    });
  });

  describe('.getSeedsPath()', function () {
    it('should return a path to the "./seeds" directory from the current working directory', function () {
      var result = sut.getSeedsPath();
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'seeds'].join('/')));
    });
  });

  describe('.getInitPath()', function () {
    it('should return a path to the cambio app\'s "initFiles" directory', function () {
      // not really a good way to test this, but at least this test will catch if the algorithm changes
      var result = sut.getInitPath();
      var expectedResult = _path2.default.normalize([__dirname, '..', 'initFiles'].join('/'));
      expect(result).to.equal(expectedResult);
    });
  });

  describe('.getConfigPath()', function () {
    it('should return a path to the "./config" directory from the current working directory', function () {
      var result = sut.getConfigPath();
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config'].join('/')));
    });
  });

  describe('.getConfigFilePath()', function () {
    it('should return a path to the specified file in the "./config" directory', function () {
      var result = sut.getConfigFilePath('fake.js');
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config', 'fake.js'].join('/')));
    });
  });

  describe('.getInitFile()', function () {
    it('should return the contents of the specified file in the cambio app\'s initFiles directory', function () {
      var result = sut.getInitFile('fake.js');
      var expectedPath = _path2.default.normalize([__dirname, '..', 'initFiles', 'fake.js'].join('/'));
      expect(fsStub.readFileSync.calledWith(expectedPath)).to.be.true;
      expect(result).to.equal('contents');
    });
  });

  describe('.getCreatedFileName()', function () {
    before(function () {
      /* so this is screwy... Have to stub the prototype for moment (which is exposed via .fn) since moment exports
      a factory */
      sinon.stub(_moment2.default.fn, 'format').returns(20160101);
    });

    it('should prepend a timestamp to the passed string', function () {
      var result = sut.getCreatedFileName('fake');
      expect(result).to.equal('20160101-fake');
    });

    after(function () {
      _moment2.default.fn.format.restore();
    });
  });

  describe('.getModelFileName', function () {
    it('should append ".model" to the provided name', function () {
      var result = sut.getModelFileName('Fake');
      expect(result).to.equal('Fake.model');
    });
  });

  describe('.getCreatedFileExtension()', function () {
    it('should return the string "js"', function () {
      var result = sut.getCreatedFileExtension();
      expect(result).to.equal('js');
    });
  });

  describe('.addFileExtension()', function () {
    it('should append ".js" to the passed string', function () {
      var result = sut.addFileExtension('name');
      expect(result).to.equal('name.js');
    });
  });

  describe('.getMigrationFilePath()', function () {
    before(function () {
      /* so this is screwy... Have to stub the prototype for moment (which is exposed via .fn) since moment exports
      a factory */
      sinon.stub(_moment2.default.fn, 'format').returns(20160101);
    });

    it('should return a path to a new migration file based on the name passed', function () {
      var result = sut.getMigrationFilePath('new');
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'migrations', '20160101-new.js'].join('/')));
    });

    after(function () {
      _moment2.default.fn.format.restore();
    });
  });

  describe('.getSeedFilePath()', function () {
    before(function () {
      /* so this is screwy... Have to stub the prototype for moment (which is exposed via .fn) since moment exports
      a factory */
      sinon.stub(_moment2.default.fn, 'format').returns(20160101);
    });

    it('should return a path to a new seed file based on the name passed', function () {
      var result = sut.getSeedFilePath('new');
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'seeds', '20160101-new.js'].join('/')));
    });

    after(function () {
      _moment2.default.fn.format.restore();
    });
  });

  describe('.getModelFilePath()', function () {
    it('should return a path to the new model file based on the name passed', function () {
      var result = sut.getModelFilePath('New');
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'models', 'New.model.js'].join('/')));
    });
  });

  describe('.getConnFilePath()', function () {
    it('should return a path to the new connection file based on the name passed', function () {
      var result = sut.getConnFilePath('new');
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config', 'new.js'].join('/')));
    });
  });

  describe('.getmigrationTemplateFilePath()', function () {
    it('should return a path to the migration template file', function () {
      var result = sut.getMigrationTemplateFilePath();
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config', 'migration.template'].join('/')));
    });
  });

  describe('.getSeedTemplateFilePath()', function () {
    it('should return a path to the seed template file', function () {
      var result = sut.getSeedTemplateFilePath();
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config', 'seed.template'].join('/')));
    });
  });

  describe('.getModelTemplateFilePath()', function () {
    it('should return a path to the model template file', function () {
      var result = sut.getModelTemplateFilePath();
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config', 'model.template'].join('/')));
    });
  });

  describe('.getConnTemplateFilePath()', function () {
    it('should return a path to the connection template file', function () {
      var result = sut.getConnTemplateFilePath();
      expect(result).to.equal(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config', 'connection.template'].join('/')));
    });
  });

  describe('.getMigrationTemplate()', function () {
    it('should return a string with the contents of the migration template', function () {
      var result = sut.getMigrationTemplate();
      expect(fsStub.readFileSync.calledWith(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config', 'migration.template'].join('/')))).to.be.true;
      expect(result).to.equal('contents');
    });
  });

  describe('.getSeedTemplate', function () {
    it('should return a string with the contents of the seed template', function () {
      var result = sut.getSeedTemplate();
      expect(fsStub.readFileSync.calledWith(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config', 'seed.template'].join('/')))).to.be.true;
      expect(result).to.equal('contents');
    });
  });

  describe('.getModelTemplate', function () {
    it('should return a string with the contents of the seed template', function () {
      var result = sut.getModelTemplate();
      expect(fsStub.readFileSync.calledWith(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config', 'model.template'].join('/')))).to.be.true;
      expect(result).to.equal('contents');
    });
  });

  describe('.getConnTemplate', function () {
    it('should return a string with the contents of the seed template', function () {
      var result = sut.getConnTemplate();
      expect(fsStub.readFileSync.calledWith(_path2.default.normalize([process.cwd(), '..', 'src', 'db', 'config', 'connection.template'].join('/')))).to.be.true;
      expect(result).to.equal('contents');
    });
  });
});