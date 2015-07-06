var fs = require('fs');
var generator = require('yeoman-generator').generators.NamedBase.__super__;
var Q = require('q');
var rimraf = require('rimraf');
var YAML = require('yamljs');

exports.spawnCommand = function (command, args) {
  var deferred = Q.defer();
  generator.spawnCommand(command, args)
  .on('exit', function() {
    deferred.resolve();
  });

  return deferred.promise;
};

exports.writeYaml = function (path, object) {
  var deferred = Q.defer();
  fs.writeFile(path, YAML.stringify(object, 8, 2), function(err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve();
    }
  });

  return deferred.promise;
};

exports.clearDirectoryPath = function() {
  var deferred = Q.defer();
  rimraf(generator.destinationPath('*'), function() {
    rimraf(generator.destinationPath('.*'), function() {
      deferred.resolve();
    });
  });

  return deferred.promise;
};
