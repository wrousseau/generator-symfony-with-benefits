'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var fs = require('fs');
var yosay = require('yosay');
var slug = require('slug');
var spawn = require('child_process').spawn;
var utils = require('./utils.js');
var YAML = require('yamljs');

module.exports = yeoman.generators.Base.extend({
  initializing: function() {
    var done = this.async();
    utils.clearDirectoryPath().then(function() {
      done()
    });
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the first-rate ' + chalk.red('SymfonyWithBenefits') + ' generator!'
    ));

    var prompts = [{
      type: 'confirm',
      name: 'someOption',
      message: 'Would you like to enable this option?',
      default: true
    }];

    this.prompt(prompts, function (props) {
      this.props = props;
      // To access props later use this.props.someOption;

      done();
    }.bind(this));
  },

  cloneSymfony: function () {
    var done = this.async();
    var self = this;
    utils.spawnCommand('composer', ['create-project', 'symfony/framework-standard-edition', '.', '--no-interaction'])
    .then(function() {
      var parametersFilePath = self.destinationPath('app/config/parameters.yml');
      var parametersFile = YAML.load(parametersFilePath);
      parametersFile.parameters['database_driver'] = 'pdo_mysql';
      parametersFile.parameters['database_name'] = slug(self.appname);
      parametersFile.parameters['database_user'] = slug(self.appname);
      return utils.writeYaml(parametersFilePath, parametersFile);
    })
    .then(function() {
      return utils.writeYaml(self.destinationPath('app/config/parameters.yml.dist'), parametersFile);
    })
    .then(function() {
      done();
    });
  },

  writing: {
    app: function () {
      this.fs.copy(
        this.templatePath('_package.json'),
        this.destinationPath('package.json')
      );
      this.fs.copy(
        this.templatePath('_bower.json'),
        this.destinationPath('bower.json')
      );
    },

    projectfiles: function () {
      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath('.editorconfig')
      );
      this.fs.copy(
        this.templatePath('jshintrc'),
        this.destinationPath('.jshintrc')
      );
    }
  },

  install: function () {
    var self = this;
    this.installDependencies();
    utils.spawnCommand('composer', ['require', 'fansible/devops-bundle', '@dev', '--dev'])
    .then(function() {
      self.bulkCopy(
        self.templatePath('_AppKernel.php'),
        self.destinationPath('app/AppKernel.php')
      );
      var configDevFilePath = self.destinationPath('app/config/config_dev.yml');
      var configDevFile = YAML.load(configDevFilePath);
      configDevFile['fansible_devops'] = {
        name: slug(self.appname),
        environments: {
          vagrant: {
            ip: '10.0.0.10',
            host: slug(self.appname)+'.dev',
            box: 'ubuntu/trusty64',
            memory: 1024,
            cpus: 1,
            exec: 100,
            src: '.',
          },
          staging: {
            ip: 'x.x.x.x',
            host: slug(self.appname)+'.staging'
          },
          prod: {
            ip: 'x.x.x.x',
            host: slug(self.appname)+'.prod'
          }
        }
      };
      return utils.writeYaml(configDevFilePath, configDevFile);
    })
    .then(function() {
      return utils.spawnCommand('app/console', ['generate:provisioning']);
    })
    .then(function() {
      return utils.spawnCommand('ansible-galaxy', ['install', '-r', 'requirements.txt']);
    })
    .then(function() {
      return utils.spawnCommand('vagrant', ['up']);
    });
  }
});
