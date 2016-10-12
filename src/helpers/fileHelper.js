'use strict';

import fs from 'fs';
import moment from 'moment';
import path from 'path';
import * as logger from './logger';

export function read(filePath) {
  try {
    return fs.readFileSync(filePath).toString();
  } catch (err) {
    logger.error(`Error reading file: ${err}`);
  }
}

export function write(targetPath, content) {
  try {
    fs.writeFileSync(targetPath, content);
    logger.log(`Created file: ${targetPath}`);
  } catch (err) {
    logger.error(`Error creating file ${targetPath}: ${err}`);
  }
}

export function makeDir(name) {
  try {
    fs.mkdirSync(`./${name}`);
    logger.log(`Created directory: ${name}`);
  } catch (err) {
    logger.error(`Error creating directory: ${err}`);
  }
}

// finds the folder that rz was init-ed into by searching for the directory containing the directories created by the init process. Don't look in directories named 'lib' or '.tmp'
export function getDbDir() {
  let rootDir = getRootDir(process.cwd());
  let dbDir = findDir(rootDir, ['config','migrations','seeds','models'], ['lib', '.tmp']);

  if (dbDir === null) {
    throw new Error('Unable to find the folder where rhinozug was initialized in this project.  You may need to initialize rhinozug by running "rhinozug init" in a new folder in the project.');
  }

  return dbDir;

  // finds the project root directory by searching recursively for the package.json file
  function getRootDir(dir) {

    // we've recursed to the root dir without finding a package.json
    if (dir === '/') {
      throw new Error('No package.json could be found for this project.  You may need to run "npm init" in the root directory of the project, or create package.json manually.')
    }

    let packageFound = false;
    fs.readdirSync(dir).map((file) => {
      if (file === 'package.json') {
        packageFound = true;
      }
    });

    if (packageFound) {
      return dir;
    } else {
      return getRootDir(path.normalize([
          dir,
          '..'
        ].join('/')));
    }
  }

  // finds a directory containing the subdirectories named in search by searching recursively through subdirectories.  Must be an exact match, case sensitive
  function findDir(startDir, searchNames, ignoreDirNames) {
    // never look in these dirs
    ignoreDirNames.push('node_modules');
    ignoreDirNames.push('.git');
    ignoreDirNames.push('.bin');

    let result = null;

    searchDir(startDir);

    return result;

    // get a list of all directories in a directory
    function getDirList(dir) {
      return fs.readdirSync(dir).filter((file) => {
        return fs.statSync(path.join(dir, file)).isDirectory();
      }).filter((dir) => {
        return ignoreDirNames.indexOf(dir) === -1;
      });
    }

    // does a depth-first search for dirs with a name matching the search term
    function searchDir(dir) {
      let subDirs = getDirList(dir);

      // this will ensure that found is false if there are no subdirectories
      let found = subDirs.length > 0;

      searchNames.map((searchName) => {
        found = found && subDirs.indexOf(searchName) !== -1;
      });

      // if found is still true, every search item was found in this directory
      if (found) {
        result = dir;
      // otherwise, continue searching into the subdirectories
      } else {
        subDirs.map((subDir) => {
          searchDir(path.join(dir, subDir)); 
        });
      }
    }
  }
}

function getDbSubdir(dirName) {
  let p = [
    getDbDir(),
    dirName
  ].join('/');
  return path.normalize(p);
}

export function getMigrationsPath() {
  return getDbSubdir('migrations');
}

export function getSeedsPath() {
  return getDbSubdir('seeds');
}

export function getModelsPath() {
  return getDbSubdir('models');
}

export function getConfigPath() {
  return getDbSubdir('config');
}

export function getConnections() {
  return fs.readdirSync(getConfigPath()).filter((file) => {
    return(file.indexOf('.template') === -1);
  }).map((file) => {
    return file.replace('.js', '');
  });
}

// initFiles is a directory in this project, not the target project, so use __dirname
export function getInitPath() {
  let p = [
    __dirname,
    '..',
    'initFiles'
  ].join('/');
  return path.normalize(p);
}

export function getConfigFilePath(filename) {
  let p = [
    getConfigPath(),
    filename
  ].join('/');
  return path.normalize(p);
}

export function getInitFile(filename) {
  let p = [
    getInitPath(),
    filename
  ].join('/');
  return read(p);
}

export function getCreatedFileName(name) {
  return [
    moment().utc().format('YYYYMMDDHHmmss'),
    name
  ].join('-');
}

export function getModelFileName(name) {
  return [
    name,
    'model'
  ].join('.');
}

export function getCreatedFileExtension() {
  return 'js';
}

export function addFileExtension(name) {
  return [name, getCreatedFileExtension()].join('.');
}

export function getMigrationFilePath(name) {
  return [
    getMigrationsPath(),
    addFileExtension(getCreatedFileName(name))
  ].join('/');
}

export function getSeedFilePath(name) {
  return [
    getSeedsPath(),
    addFileExtension(getCreatedFileName(name))
  ].join('/');
}

export function getModelFilePath(name) {
  return [
    getModelsPath(),
    addFileExtension(getModelFileName(name))
  ].join('/');
}

export function getConnFilePath(name) {
  return [
    getConfigPath(),
    addFileExtension(name)
  ].join('/');
}

export function getMigrationTemplateFilePath() {
  let p = [
    getConfigPath(),
    'migration.template'
  ].join('/');
  return path.normalize(p);
}

export function getSeedTemplateFilePath() {
  let p = [
    getConfigPath(),
    'seed.template'
  ].join('/');
  return path.normalize(p);
}

export function getModelTemplateFilePath() {
  let p = [
    getConfigPath(),
    'model.template'
  ].join('/');
  return path.normalize(p);
}

export function getConnTemplateFilePath() {
  let p = [
    getConfigPath(),
    'connection.template'
  ].join('/');
  return path.normalize(p);
}

export function getMigrationTemplate() {
  return read(getMigrationTemplateFilePath());
}

export function getModelTemplate() {
  return read(getModelTemplateFilePath());
}

export function getSeedTemplate() {
  return read(getSeedTemplateFilePath());
}

export function getConnTemplate() {
  return read(getConnTemplateFilePath());
}
