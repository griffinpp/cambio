'use strict';

import proxyquire from 'proxyquire';
import path from 'path';
import moment from 'moment';

let error = new Error('derp!');

let fsStub = {
  readFileSync: sinon.stub().returns('contents'),
  writeFileSync: sinon.stub().returns('ok'),
  mkdirSync: sinon.stub().returns('ok'),
  readdirSync: sinon.stub(),
  statSync: sinon.stub().returns({
    isDirectory: sinon.stub().returns(true)
  })
};

let loggerStub = {
  log: sinon.stub(),
  warning: sinon.stub(),
  error: sinon.stub()
};

let sut = proxyquire('../helpers/fileHelper', 
  {
    'fs': fsStub,
    './logger': loggerStub
  }
);

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

describe('fileHelper module', () => {

  beforeEach(() => {
    loggerStub.log.reset();
    loggerStub.warning.reset();
    loggerStub.error.reset();

    setupReadDirSuccess();
  });

  describe('.getDbDir', () => {
    describe('when a package.json is found in the project', () => {
      describe('when rhinozug has been initialized in the project', () => {
        beforeEach(setupReadDirSuccess);

        it('should return the directory where rhinozug was initialized', () => {
          let result = sut.getDbDir();

          // package.json is not "found" in the first call to fs.readdirSync, so it should go down a level
          expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db'].join('/')));
        });
      });

      describe('when rhinozug has not been initialized in the project', () => {
        beforeEach(setupReadDirFail);

        it('should throw an error', () => {
          expect(sut.getDbDir.bind(sut)).to.throw;
        });
      });
    });
    describe('when the project has no package.json', () => {
      beforeEach(setupNoPackage);

      it('should throw an error', () => {
        expect(sut.getDbDir.bind(sut)).to.throw;
      });
    });
  });

  describe('.read()', () => {
    it('should return a string of the contents of the file', () => {
      // just verifying that the correct fs function is called
      let result = sut.read('fakeFile.txt');
      expect(fsStub.readFileSync.calledWith('fakeFile.txt')).to.be.true;
      expect(result).to.equal('contents');
    });

    describe('when there is an error', () => {
      beforeEach(() => {
        fsStub.readFileSync.throws(error);
      });

      it('should log the error', () => {
        let result = sut.read('fakeFile.txt');
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(() => {
        fsStub.readFileSync = sinon.stub().returns('contents');
      });
    });
  });

  describe('.write()', () => {
    it('should write the string to the specified file', () => {
      // again, just verifying that the correct fs function is called
      sut.write('fakeFile.txt', 'contents');
      expect(fsStub.writeFileSync.calledWith('fakeFile.txt', 'contents')).to.be.true;
    });

    describe('when there is an error', () => {
      beforeEach(() => {
        fsStub.writeFileSync.throws(error);
      });

      it('should log the error', () => {
        let result = sut.write('fakeFile.txt', 'contents');
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(() => {
        fsStub.writeFileSync = sinon.stub().returns('ok');
      });
    });
  });

  describe('.makeDir()', () => {
    it('should create a directory with the specified name in the current working directory', () => {
      sut.makeDir('fakeDir');
      expect(fsStub.mkdirSync.calledWith('./fakeDir')).to.be.true;
    });

    describe('when there is an error', () => {
      beforeEach(() => {
        fsStub.mkdirSync.throws(error);
      });

      it('should log the error', () => {
        let result = sut.makeDir('./fakeDir');
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(() => {
        fsStub.mkdirSync = sinon.stub().returns('ok');
      });
    });
  });

  describe('.getMigrationsPath()', () => {
      it('should return a path to the "migrations" directory in the directory where "rhinozug init" was called', () => {
          let result = sut.getMigrationsPath();
          expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','migrations'].join('/')));
      });
  });

  describe('.getSeedsPath()', () => {
    it('should return a path to the "./seeds" directory from the current working directory', () => {
        let result = sut.getSeedsPath();
        expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','seeds'].join('/')));
    });
  });

  describe('.getInitPath()', () => {
    it('should return a path to the rhinozug app\'s "initFiles" directory', () => {
      // not really a good way to test this, but at least this test will catch if the algorithm changes
      let result = sut.getInitPath();
      let expectedResult = path.normalize([__dirname,'..', 'initFiles'].join('/'));
      expect(result).to.equal(expectedResult);
    });
  });

  describe('.getConfigPath()', () => {
    it('should return a path to the "./config" directory from the current working directory', () => {
        let result = sut.getConfigPath();
        expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','config'].join('/')));
    });
  });

  describe('.getConfigFilePath()', () => {
    it('should return a path to the specified file in the "./config" directory', () => {
        let result = sut.getConfigFilePath('fake.js');
        expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','config','fake.js'].join('/')));
    });
  });

  describe('.getInitFile()', () => {
    it('should return the contents of the specified file in the rhinozug app\'s initFiles directory', () => {
        let result = sut.getInitFile('fake.js');
        let expectedPath = path.normalize([__dirname,'..', 'initFiles', 'fake.js'].join('/'));
        expect(fsStub.readFileSync.calledWith(expectedPath)).to.be.true;
        expect(result).to.equal('contents');
    });
  });

  describe('.getCreatedFileName()', () => {
    before(() => {
      /* so this is screwy... Have to stub the prototype for moment (which is exposed via .fn) since moment exports
      a factory */
      sinon.stub(moment.fn, 'format').returns(20160101);    
    });

    it('should prepend a timestamp to the passed string', () => {
      let result = sut.getCreatedFileName('fake');
      expect(result).to.equal('20160101-fake');
    });

    after(() => {
      moment.fn.format.restore();
    });
  });

  describe('.getModelFileName', () => {
    it('should append ".model" to the provided name', () => {
      let result = sut.getModelFileName('Fake');
      expect(result).to.equal('Fake.model');
    });
  });

  describe('.getCreatedFileExtension()', () => {
    it('should return the string "js"', () => {
        let result = sut.getCreatedFileExtension();
        expect(result).to.equal('js');
    });
  });

  describe('.addFileExtension()', () => {
    it('should append ".js" to the passed string', () => {
        let result = sut.addFileExtension('name');
        expect(result).to.equal('name.js');
    });
  });

  describe('.getMigrationFilePath()', () => {
    before(() => {
      /* so this is screwy... Have to stub the prototype for moment (which is exposed via .fn) since moment exports
      a factory */
      sinon.stub(moment.fn, 'format').returns(20160101);    
    });

    it('should return a path to a new migration file based on the name passed', () => {
      let result = sut.getMigrationFilePath('new');
      expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','migrations','20160101-new.js'].join('/')));
    });

    after(() => {
      moment.fn.format.restore();
    });
  });

  describe('.getSeedFilePath()', () => {
    before(() => {
      /* so this is screwy... Have to stub the prototype for moment (which is exposed via .fn) since moment exports
      a factory */
      sinon.stub(moment.fn, 'format').returns(20160101);    
    });

    it('should return a path to a new seed file based on the name passed', () => {
      let result = sut.getSeedFilePath('new');
      expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','seeds','20160101-new.js'].join('/')));
    });
    
    after(() => {
      moment.fn.format.restore();
    });
  });

  describe('.getModelFilePath()', () => {
    it('should return a path to the new model file based on the name passed', () => {
      let result = sut.getModelFilePath('New');
      expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','models','New.model.js'].join('/')));
    });
  });

  describe('.getConnFilePath()', () => {
    it('should return a path to the new connection file based on the name passed', () => {
      let result = sut.getConnFilePath('new');
      expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','config','new.js'].join('/')));
    });
  });

  describe('.getmigrationTemplateFilePath()', () => {
    it('should return a path to the migration template file', () => {
      let result = sut.getMigrationTemplateFilePath();
      expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','config','migration.template'].join('/')));
    });
  });

  describe('.getSeedTemplateFilePath()', () => {
    it('should return a path to the seed template file', () => {
      let result = sut.getSeedTemplateFilePath();
      expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','config','seed.template'].join('/')));
    });
  });

  describe('.getModelTemplateFilePath()', () => {
    it('should return a path to the model template file', () => {
      let result = sut.getModelTemplateFilePath();
      expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','config','model.template'].join('/')));
    });
  });

  describe('.getConnTemplateFilePath()', () => {
    it('should return a path to the connection template file', () => {
      let result = sut.getConnTemplateFilePath();
      expect(result).to.equal(path.normalize([process.cwd(), '..', 'src','db','config','connection.template'].join('/')));
    });
  });

  describe('.getMigrationTemplate()', () => {
    it('should return a string with the contents of the migration template', () => {
      let result = sut.getMigrationTemplate();
      expect(fsStub.readFileSync.calledWith(path.normalize([process.cwd(), '..', 'src','db','config','migration.template'].join('/')))).to.be.true;
      expect(result).to.equal('contents');
    });
  });

  describe('.getSeedTemplate', () => {
    it('should return a string with the contents of the seed template', () => {
      let result = sut.getSeedTemplate();
      expect(fsStub.readFileSync.calledWith(path.normalize([process.cwd(), '..', 'src','db','config','seed.template'].join('/')))).to.be.true;
      expect(result).to.equal('contents');
    });
  });

  describe('.getModelTemplate', () => {
    it('should return a string with the contents of the seed template', () => {
      let result = sut.getModelTemplate();
      expect(fsStub.readFileSync.calledWith(path.normalize([process.cwd(), '..', 'src','db','config','model.template'].join('/')))).to.be.true;
      expect(result).to.equal('contents');
    });
  });

  describe('.getConnTemplate', () => {
    it('should return a string with the contents of the seed template', () => {
      let result = sut.getConnTemplate();
      expect(fsStub.readFileSync.calledWith(path.normalize([process.cwd(), '..', 'src','db','config','connection.template'].join('/')))).to.be.true;
      expect(result).to.equal('contents');
    });
  });
});
