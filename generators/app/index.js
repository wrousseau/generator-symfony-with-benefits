'use strict';
var _ = require('lodash');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var fs = require('fs');
var yosay = require('yosay');
var slug = require('slug');
var spawn = require('child_process').spawn;
var utils = require('./utils.js');
var YAML = require('yamljs');

module.exports = yeoman.generators.Base.extend({

  greeting: function() {
    this.log(yosay(
      'Welcome to the ' + chalk.red('Symfony With Benefits') + ' generator!'
      + ' It\'s like your best Symfony friend, but with many benefits'
    ));
  },

  initializing: function() {
    var done = this.async();
    var self = this;
    this.prompt({
      type    : 'confirm',
      name    : 'res',
      message : 'This whole directory is about to be cleared ! Is that ok ?',
    }, function (answer) {
      if (answer.res) {
        utils.clearDirectoryPath().then(function() {
          done()
        });
      } else {
        self.log(yosay('I\'m not playing then...'));
        process.exit()
      }
    }.bind(this));
  },

  prompting: function () {
    var done = this.async();

    var self = this;
    this.prompt({
        name    : 'projectName',
        message : 'What is your project name ? I will slugify it for you',
        default : slug(this.appname)
      }, function (answers) {
      if (answers.projectName) {
        this.projectName = slug(answers.projectName);
        this.log(yosay(
          'Let\'s now go through the provisioning configuration, shall we ?'
        ));
        var prompts = [
          {
              name    : 'devIP',
              message : 'Which IP would you like to use for your dev environment (Vagrant) ?',
              default : '10.0.0.1'
          },
          {
              name    : 'devURL',
              message : 'What about its URL ? We will add it to your /etc/hosts file (needs sudo)',
              default : this.projectName+'.dev'
          }
        ]
        this.prompt(prompts, function(answers) {
          _.forEach(answers, function(answer, key) {
            self[key] = answer;
          });
          var addToHostCommand = "echo '"+self.devIP+" "+self.devURL+"' >> /etc/hosts"
          utils.spawnCommand('sudo', ['/bin/bash', '-c', addToHostCommand])
          .then(function() {
            done();
          });
        }.bind(this));
      } else {
        self.log(yosay('Not very talkative, are you ?'));
        process.exit();
      }
    }.bind(this));
  },

  cloneSymfony: function () {
    var done = this.async();
    this.log(yosay(
      'I\'m now going to get that Symfony project going ! I\'ll use some sensible defaults for the database, with no password for now'
    ));
    var self = this;
    utils.spawnCommand('composer', ['create-project', 'symfony/framework-standard-edition', '.', '--no-interaction'])
    .then(function() {
      var parametersFilePath = self.destinationPath('app/config/parameters.yml');
      self.parametersFile = YAML.load(parametersFilePath);
      self.parametersFile.parameters['database_driver'] = 'pdo_mysql';
      self.parametersFile.parameters['database_name'] = self.projectName;
      self.parametersFile.parameters['database_user'] = self.projectName;
      return utils.writeYaml(parametersFilePath, self.parametersFile);
    })
    .then(function() {
      return utils.writeYaml(self.destinationPath('app/config/parameters.yml.dist'), self.parametersFile);
    })
    .then(function() {
      self.log('\nI\'m done with that !\n');
      done();
    });
  },

  writing: {
    app: function () {
      this.log(yosay(
        'Now adding some cool package.json and bower.json just for you !'
      ));
      this.fs.copy(
        this.templatePath('_package.json'),
        this.destinationPath('package.json')
      );
      this.fs.copy(
        this.templatePath('_bower.json'),
        this.destinationPath('bower.json')
      );
      this.fs.copy(
        this.templatePath('_.travis.yml'),
        this.destinationPath('.travis.yml')
      )
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
    this.log(yosay(
      'Now adding some fancy bundles for your Symfony !'
    ));
    utils.spawnCommand('composer', ['require', 'fansible/devops-bundle', '@dev', '--dev'])
    .then(function() {
      self.bulkCopy(
        self.templatePath('_AppKernel.php'),
        self.destinationPath('app/AppKernel.php')
      );
      var configDevFilePath = self.destinationPath('app/config/config_dev.yml');
      var configDevFile = YAML.load(configDevFilePath);
      configDevFile['fansible_devops'] = {
        name: self.projectName,
        environments: {
          vagrant: {
            ip: self.devIP,
            host: self.devURL,
            box: 'ubuntu/trusty64',
            memory: 1024,
            cpus: 1,
            exec: 100,
            src: '.',
          },
          staging: {
            ip: 'x.x.x.x',
            host: self.projectName+'.staging'
          },
          prod: {
            ip: 'x.x.x.x',
            host: self.projectName+'.prod'
          }
        }
      };
      return utils.writeYaml(configDevFilePath, configDevFile);
    })
    .then(function() {
      return utils.spawnCommand('app/console', ['cache:clear']);
    })
    .then(function() {
      self.log(yosay(
        'Now generating the provisioning thanks to Fansible DevopsBundle !'
      ));
      return utils.spawnCommand('app/console', ['generate:provisioning']);
    })
    .then(function() {
      self.log(yosay(
        'Downloading some amazing Ansible roles !'
      ));
      return utils.spawnCommand('ansible-galaxy', ['install', '-r', 'requirements.txt']);
    })
    .then(function() {
      self.log(yosay(
        'Upping your vagrant just for you ! This might '+chalk.red('(and will)')+' take a while...'
      ));
      return utils.spawnCommand('vagrant', ['up']);
    });
  }
});
