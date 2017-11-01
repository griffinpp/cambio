'use strict';

import proxyquire from 'proxyquire';
import * as promiseHelp from './promiseHelper';

let fhStub = {
  getDbDir: sinon.stub().returns('/user/repos/testProject/db'),
  getMigrationsPath: sinon.stub().returns('/user/repos/testProject/db/migrations'),
  getSeedsPath: sinon.stub().returns('/user/repos/testProject/db/seeds'),
  getMigrationTemplate: sinon.stub().returns('migration template contents'),
  getModelTemplate: sinon.stub().returns('<#modelName>:<#tableName>'),
  getConnTemplate: sinon.stub().returns('<#host>:<#port>:<#database>:<#user>:<#password>:<#ssl>:<#pool>'),
  getSeedTemplate: sinon.stub().returns('seed template contents'),
  getMigrationFilePath: (name) => {
    return `migration/20160101-${name}.js`;
  },
  getSeedFilePath: (name) => {
    return `seed/20160101-${name}.js`;
  },
  getConfigFilePath: (name) => {
    return `config/${name}`;
  },
  getModelFilePath: (name) => {
    return `model/${name}.model.js`;
  },
  getConnFilePath: (name) => {
    return `config/${name}.js`;
  },
  getInitFile: sinon.stub().returns('init file contents'),
  read: sinon.stub().returns('fake contents'),
  write: sinon.stub(),
  makeDir: sinon.stub()
};

let error = new Error('derp!');

let cpStub = {
  exec: sinon.stub()
};

let umzugStub = function() {};

// create local stubs so we can monitor what's going on
let up = sinon.stub().returns(Promise.resolve());
let down = sinon.stub().returns(Promise.resolve());

umzugStub.prototype = {
  up,
  down
};

let loggerStub = {
  log: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub()
};

let sut = proxyquire('../index', {
  './helpers/fileHelper': fhStub,
  'umzug': umzugStub,
  'child_process': cpStub,
  './helpers/logger': loggerStub
});

describe('cambio module', () => {
  beforeEach(() => {

    loggerStub.error.reset();
    loggerStub.warn.reset();
    loggerStub.error.reset();      
  });

  describe('.createMigration', () => {
    describe('when there is not an error', () => {
      it('should log the creation of the migration', () => {
        sut.createMigration('testName');
        expect(loggerStub.log.called).to.be.true;
      });

      describe('when a name is specified', () => {
        it('should create a new copy of the migration template in the migrations directory using the name given as the legible part of the filename', () => {
          sut.createMigration('testName');
          expect(fhStub.write.calledWith('migration/20160101-testName.js', 'migration template contents')).to.be.true;
        });
      });

      describe('when a name is not specified', () => {
        it('should create a new copy of the migration template in the migrations directory using "unnamed" as the legible part of the filename', () => {
          sut.createMigration();
          expect(fhStub.write.calledWith('migration/20160101-unnamed.js', 'migration template contents')).to.be.true;
        });
      });
    });

    describe('when there is an error', () => {
      beforeEach(() => {
        fhStub.write.throws(error);
      });

      it('should log the error', () => {
        sut.createMigration('testName');
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(() => {
        fhStub.write = sinon.stub(); 
      });        
    });
  });

  describe('.up()', () => {

    beforeEach(() => {
      up.reset();
      up.returns(Promise.resolve());
    });

    describe('when there is not an error', () => {

      it('should set the connection', (done) => {
        promiseHelp.testAfterPromise(sut.up(), () => {
          expect(process.env.connection).not.to.equal(null);
        }, done);
      });

      it('should log the completion of the event', (done) => {
        promiseHelp.testAfterPromise(sut.up(), () => {
          expect(loggerStub.log.called).to.be.true;
        }, done);
      });

      describe('when a file is specified', () => {
        it('should run migrations up to the specified file', (done) => {
          promiseHelp.testAfterPromise(sut.up('testFile.js'), () => {
            expect(up.calledWith({to: 'testFile.js'})).to.be.true;
          }, done);
        });
      });

      describe('when a file is not specified', () => {
        it('should run all migrations up the most current file', (done) => {
         promiseHelp.testAfterPromise(sut.up(), () => {
           expect(up.called).to.be.true;
         }, done);
        });
      });
    });

    describe('when there is an error', () => {
      beforeEach(() => {
        up.returns(Promise.reject);
      });

      it('should log the error', (done) => {
        promiseHelp.testAfterPromise(sut.up(), () => {
          expect(loggerStub.error.called).to.be.true;
        }, done);        
      });        
    });
  });

  describe('.down()', () => {

    beforeEach(() => {
      down.reset();
      down.returns(Promise.resolve());
    });

    describe('when there is not an error', () => {

      it('should set the connection', (done) => {
        promiseHelp.testAfterPromise(sut.down(), () => {
          expect(process.env.connection).not.to.equal(null);
        }, done);
      });

      it('should log the completion of the event', (done) => {
        promiseHelp.testAfterPromise(sut.down(), () => {
          expect(loggerStub.log.called).to.be.true;
        }, done);
      });
      
      describe('when a file is specified', () => {
        it('should run migrations down to the specified file', (done) => {
          // done(new Error('test error'));
          promiseHelp.testAfterPromise(sut.down('testFile.js'), () => {
            expect(down.calledWith({to: 'testFile.js'})).to.be.true;    
          }, done);        
        });
      });

      describe('when a file is not specified', () => {
        it('should run down the last migration that was run up', (done) => {
          promiseHelp.testAfterPromise(sut.down(), () => {
            expect(down.called).to.be.true;
          }, done);
        });
      });
    });

    describe('when there is an error', () => {
      beforeEach(() => {
        down.returns(Promise.reject());
      });

      it('should log the error', (done) => {
        promiseHelp.testAfterPromise(sut.down(), () => {
          expect(loggerStub.error.called).to.be.true;
        }, done);        
      });        
    });
  });

  describe('.createSeed()', () => {
    describe('when there is not an error', () => {
      it('should log the creation of the seed', () => {
        sut.createSeed('testName');
        expect(loggerStub.log.called).to.be.true;
      });

      describe('when a name is specified', () => {
        it('should create a new copy of the seed template in the seeds directory using the name given as the legible part of the filename', () => {
          sut.createSeed('testName');
          expect(fhStub.write.calledWith('seed/20160101-testName.js', 'seed template contents')).to.be.true;
        });
      });

      describe('when a name is not specified', () => {
        it('should create a new copy of the seed template in the seeds directory using "unnamed" as the legible part of the filename', () => {
          sut.createSeed();
          expect(fhStub.write.calledWith('seed/20160101-unnamed.js', 'seed template contents')).to.be.true;
        });
      });
    });

    describe('when there is an error', () => {
      beforeEach(() => {
        fhStub.write.throws(error);
      });

      it('should log the error', () => {
        sut.createSeed('testName');
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(() => {
        fhStub.write = sinon.stub(); 
      });        
    });
  });

  describe('.createModel()', () => {
    describe('when there is not a general error', () => {
      it('should log the creation of the model', () => {
        sut.createModel('Item', 'Items');
        expect(loggerStub.log.called).to.be.true;
      });

      describe('when no table name is specified', () => {
        it('should use the model name as the table name', () => {
          sut.createModel('Item');
          expect(fhStub.write.calledWith('model/Item.model.js', 'Item:Item'))
        });

        it('should warn that the model name is being used as the table name', () => {
          sut.createModel('Item');
          expect(loggerStub.warn.called).to.be.true;
        });
      });

      describe('when no model name is specified', () => {
        it('should log an error', () => {
          sut.createModel();
          expect(loggerStub.error.called).to.be.true;
        });
      });
    });

    describe('when there is an error not related to provided names', () => {
      beforeEach(() => {
        fhStub.write.throws(error);
      });

      it('should log the error', () => {
        sut.createModel('Item', 'Items');
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(() => {
        fhStub.write = sinon.stub(); 
      });        
    });
  });

  describe('.createConn()', () => {
    let info = {
      name: 'Test',
      host: 'localhost',
      port: 1234,
      user: 'root',
      password: '',
      database: 'Test',
      aws: false,
      pool: false
    }

    describe('when there is not an error', () => {
      it('should log the creation of the connection', () => {
        sut.createConn(info);
        expect(loggerStub.log.called).to.be.true;
      });

      it('should use the name provided as the connection name', () => {
        sut.createConn(info);
        expect(fhStub.write.calledWith('config/Test.js')).to.be.true;
      });

      it('should insert the provided data into the appropriate places in the template', () => {
        sut.createConn(info);
        expect(fhStub.write.firstCall.args[1]).to.equal('localhost:1234:Test:root:::');
      });

      describe('when an AWS connection is specified', () => {
        before(() => {
          fhStub.write.reset();
          info.aws = true;
        });

        it('should specify an ssl connection of type Amazon RDS', () => {
          sut.createConn(info);
          expect(fhStub.write.firstCall.args[1]).to.equal(`localhost:1234:Test:root::ssl: 'Amazon RDS',:`);
        });

        after(() => {
          info.aws = false;
        });
      });

      describe('when a connection pool is specified', () => {
        before(() => {
          fhStub.write.reset();
          info.pool = true;
          info.poolMin = 3;
          info.poolMax = 13;
        });

        it('should specify the pool information using the max and min provided', () => {
          sut.createConn(info);
          expect(fhStub.write.firstCall.args[1]).to.equal('localhost:1234:Test:root:::pool: { min: 3, max: 13 },');
        });

        after(() => {
          info.pool = false;
        })
      });
    });

    describe('when there is an error', () => {
      beforeEach(() => {
        fhStub.write.throws(error);
      });

      it('should log the error', () => {
        sut.createConn('Item', 'Items');
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(() => {
        fhStub.write = sinon.stub(); 
      });        
    });
  });

  describe('.seed()', () => {
    beforeEach(() => {
      up.reset();
      up.returns(Promise.resolve());
    });

    describe('when there is not an error', () => {
      it('should set the connection', (done) => {
        promiseHelp.testAfterPromise(sut.seed(), () => {
          expect(process.env.connection).not.to.equal(null);
        }, done);
      });

      it('should log the completion of the event', (done) => {
        promiseHelp.testAfterPromise(sut.seed(), () => {
          expect(loggerStub.log.called).to.be.true;
        }, done);
      });
        
      it('should run Umzug.up with the specified file', () => {
        sut.seed('file');
        expect(up.calledWith('file')).to.be.true;
      });

    });

    describe('when there is an error', () => {
      beforeEach(() => {
        up.returns(Promise.reject());
      });

      it('should log the error', (done) => {
        promiseHelp.testAfterPromise(sut.seed(), () => {
          expect(loggerStub.error.called).to.be.true;
        }, done);        
      });        
    });
  });

  describe('.unseed()', () => {
    beforeEach(() => {
      down.reset();
      down.returns(Promise.resolve());
    });

    describe('when there is not an error', () => {

      it('should set the connection', (done) => {
        promiseHelp.testAfterPromise(sut.unseed(), () => {
          expect(process.env.connection).not.to.equal(null);
        }, done);
      });

      it('should log the completion of the event', (done) => {
        promiseHelp.testAfterPromise(sut.unseed(), () => {
          expect(loggerStub.log.called).to.be.true;
        }, done);
      });

      it('should run Umzug.down with the specified file', (done) => {
        promiseHelp.testAfterPromise(sut.unseed('file'), () => {
          expect(down.calledWith('file')).to.be.true;
        }, done);
      });
    
    });

    describe('when there is an error', () => {
      beforeEach(() => {
        down.returns(Promise.reject());
      });

      it('should log the error', (done) => {
        promiseHelp.testAfterPromise(sut.unseed(), () => {
          expect(loggerStub.error.called).to.be.true;
        }, done);        
      });        
    });
  });

  describe('.init()', () => {
    describe('when there is not an error', () => {
        
      it('should create a config directory', () => {
        sut.init();
        expect(fhStub.makeDir.calledWith('config')).to.be.true;
      });

      it('should create a migrations directory', () => {
        sut.init();
        expect(fhStub.makeDir.calledWith('migrations')).to.be.true;
      }); 

      it('should create a seeds directory', () => {
        sut.init();
        expect(fhStub.makeDir.calledWith('seeds')).to.be.true;
      });

      it('should copy the default connection config file into the new config folder', () => {
        sut.init();
        expect(fhStub.getInitFile.calledWith('default.connection')).to.be.true;
        expect(fhStub.write.calledWith('config/default.js', 'init file contents')).to.be.true;
      });

      it('should copy the migration template into the new config folder', () => {
        sut.init();
        expect(fhStub.getInitFile.calledWith('migration.template')).to.be.true;
        expect(fhStub.write.calledWith('config/migration.template', 'init file contents')).to.be.true;
      });

      it('should copy the seed template into the new config folder', () => {
        sut.init();
        expect(fhStub.getInitFile.calledWith('seed.template')).to.be.true;
        expect(fhStub.write.calledWith('config/seed.template', 'init file contents')).to.be.true;
      });

      it('should npm install the cambio connection module', () => {
        sut.init();
        expect(cpStub.exec.calledWith('npm install --save cambio')).to.be.true;
      });

    });

    describe('when there is an error', () => {
      beforeEach(() => {
        fhStub.write.throws(error); 
      });

      it('should log the error', () => {
        sut.init();
        expect(loggerStub.error.called).to.be.true;
      });

      afterEach(() => {
        fhStub.write = sinon.stub(); 
      }); 
    });
  });
});