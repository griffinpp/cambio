'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.read = read;
exports.write = write;
exports.makeDir = makeDir;
exports.getDbDir = getDbDir;
exports.getMigrationsPath = getMigrationsPath;
exports.getSeedsPath = getSeedsPath;
exports.getModelsPath = getModelsPath;
exports.getConfigPath = getConfigPath;
exports.getConnections = getConnections;
exports.getInitPath = getInitPath;
exports.getConfigFilePath = getConfigFilePath;
exports.getInitFile = getInitFile;
exports.getCreatedFileName = getCreatedFileName;
exports.getModelFileName = getModelFileName;
exports.getCreatedFileExtension = getCreatedFileExtension;
exports.addFileExtension = addFileExtension;
exports.getMigrationFilePath = getMigrationFilePath;
exports.getSeedFilePath = getSeedFilePath;
exports.getModelFilePath = getModelFilePath;
exports.getConnFilePath = getConnFilePath;
exports.getMigrationTemplateFilePath = getMigrationTemplateFilePath;
exports.getSeedTemplateFilePath = getSeedTemplateFilePath;
exports.getModelTemplateFilePath = getModelTemplateFilePath;
exports.getConnTemplateFilePath = getConnTemplateFilePath;
exports.getMigrationTemplate = getMigrationTemplate;
exports.getModelTemplate = getModelTemplate;
exports.getSeedTemplate = getSeedTemplate;
exports.getConnTemplate = getConnTemplate;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _logger = require('./logger');

var logger = _interopRequireWildcard(_logger);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function read(filePath) {
  try {
    return _fs2.default.readFileSync(filePath).toString();
  } catch (err) {
    logger.error('Error reading file: ' + err);
    return null;
  }
}

function write(targetPath, content) {
  try {
    _fs2.default.writeFileSync(targetPath, content);
    logger.log('Created file: ' + targetPath);
  } catch (err) {
    logger.error('Error creating file ' + targetPath + ': ' + err);
  }
}

function makeDir(name) {
  try {
    _fs2.default.mkdirSync('./' + name);
    logger.log('Created directory: ' + name);
  } catch (err) {
    logger.error('Error creating directory: ' + err);
  }
}

// finds the folder that co was init-ed into by searching for the directory containing the directories created by the init process. Don't look in directories named 'lib' or '.tmp'
function getDbDir() {
  var rootDir = getRootDir(process.cwd());
  var dbDir = findDir(rootDir, ['config', 'migrations', 'seeds', 'models'], ['lib', '.tmp']);

  if (dbDir === null) {
    throw new Error('Unable to find the folder where cambio was initialized in this project.  You may need to initialize cambio by running "cambio init" in a new folder in the project.');
  }

  return dbDir;

  // finds the project root directory by searching recursively for the package.json file
  function getRootDir(dir) {
    // we've recursed to the root dir without finding a package.json
    if (dir === '/') {
      throw new Error('No package.json could be found for this project.  You may need to run "npm init" in the root directory of the project, or create package.json manually.');
    }

    var packageFound = false;
    _fs2.default.readdirSync(dir).forEach(function (file) {
      if (file === 'package.json') {
        packageFound = true;
      }
    });

    if (packageFound) {
      return dir;
    }
    return getRootDir(_path2.default.normalize([dir, '..'].join('/')));
  }

  // finds a directory containing the subdirectories named in search by searching recursively through subdirectories.  Must be an exact match, case sensitive
  function findDir(startDir, searchNames, ignoreDirNames) {
    // never look in these dirs
    ignoreDirNames.push('node_modules');
    ignoreDirNames.push('.git');
    ignoreDirNames.push('.bin');

    // feel like this can be done better, just can't get my brain to engage on it today
    var result = null;

    searchDir(startDir);

    return result;

    // get a list of all directories in a directory
    function getDirList(dir) {
      return _fs2.default.readdirSync(dir).filter(function (file) {
        return _fs2.default.statSync(_path2.default.join(dir, file)).isDirectory();
      }).filter(function (d) {
        return ignoreDirNames.indexOf(d) === -1;
      });
    }

    // does a depth-first search for dirs with a name matching the search term
    function searchDir(dir) {
      var subDirs = getDirList(dir);

      var found = searchNames.reduce(function (acc, name) {
        return acc && subDirs.indexOf(name) !== -1;
      }, subDirs.length > 0);

      // if found is still true, every search item was found in this directory
      if (found) {
        result = dir;
        // otherwise, continue searching into the subdirectories
      } else {
        subDirs.forEach(function (subDir) {
          searchDir(_path2.default.join(dir, subDir));
        });
      }
    }
  }
}

function getDbSubdir(dirName) {
  var p = [getDbDir(), dirName].join('/');
  return _path2.default.normalize(p);
}

function getMigrationsPath() {
  return getDbSubdir('migrations');
}

function getSeedsPath() {
  return getDbSubdir('seeds');
}

function getModelsPath() {
  return getDbSubdir('models');
}

function getConfigPath() {
  return getDbSubdir('config');
}

function getConnections() {
  return _fs2.default.readdirSync(getConfigPath()).filter(function (file) {
    return file.indexOf('.template') === -1;
  }).map(function (file) {
    return file.replace('.js', '');
  });
}

// initFiles is a directory in this project, not the target project, so use __dirname
function getInitPath() {
  var p = [__dirname, '..', 'initFiles'].join('/');
  return _path2.default.normalize(p);
}

function getConfigFilePath(filename) {
  var p = [getConfigPath(), filename].join('/');
  return _path2.default.normalize(p);
}

function getInitFile(filename) {
  var p = [getInitPath(), filename].join('/');
  return read(p);
}

function getCreatedFileName(name) {
  return [(0, _moment2.default)().utc().format('YYYYMMDDHHmmss'), name].join('-');
}

function getModelFileName(name) {
  return [name, 'model'].join('.');
}

function getCreatedFileExtension() {
  return 'js';
}

function addFileExtension(name) {
  return [name, getCreatedFileExtension()].join('.');
}

function getMigrationFilePath(name) {
  return [getMigrationsPath(), addFileExtension(getCreatedFileName(name))].join('/');
}

function getSeedFilePath(name) {
  return [getSeedsPath(), addFileExtension(getCreatedFileName(name))].join('/');
}

function getModelFilePath(name) {
  return [getModelsPath(), addFileExtension(getModelFileName(name))].join('/');
}

function getConnFilePath(name) {
  return [getConfigPath(), addFileExtension(name)].join('/');
}

function getMigrationTemplateFilePath() {
  var p = [getConfigPath(), 'migration.template'].join('/');
  return _path2.default.normalize(p);
}

function getSeedTemplateFilePath() {
  var p = [getConfigPath(), 'seed.template'].join('/');
  return _path2.default.normalize(p);
}

function getModelTemplateFilePath() {
  var p = [getConfigPath(), 'model.template'].join('/');
  return _path2.default.normalize(p);
}

function getConnTemplateFilePath() {
  var p = [getConfigPath(), 'connection.template'].join('/');
  return _path2.default.normalize(p);
}

function getMigrationTemplate() {
  return read(getMigrationTemplateFilePath());
}

function getModelTemplate() {
  return read(getModelTemplateFilePath());
}

function getSeedTemplate() {
  return read(getSeedTemplateFilePath());
}

function getConnTemplate() {
  return read(getConnTemplateFilePath());
}