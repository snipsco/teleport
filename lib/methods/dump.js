'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dump = dump;
exports.dumpProject = dumpProject;
exports.dumpProjectBoilerplate = dumpProjectBoilerplate;
exports.getDumpProjectBoilerplateCommand = getDumpProjectBoilerplateCommand;

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function dump() {
  this.getLevelMethod('dump')();
  this.consoleInfo('Your teleport dump was sucessful !');
}

function dumpProject() {
  var project = this.project;
  // boilerplate

  this.dumpProjectBoilerplate();
  // base requirements
  this.setProjectEnvironment();
  this.program.method = 'configureServerBaseRequirements';
  this.mapInServers();
  // info
  this.consoleInfo('Your ' + project.package.name + ' project was successfully configured!');
}

function dumpProjectBoilerplate() {
  var project = this.project;

  this.consoleInfo('Let\'s dump the templates in ' + project.package.name);
  var command = this.getDumpProjectBoilerplateCommand();
  this.consoleLog(command);
  var buffer = _child_process2.default.execSync(command);
  console.log(buffer.toString('utf-8'));
}

function getDumpProjectBoilerplateCommand() {
  var _this = this;

  var configFile = this.app.configFile,
      project = this.project;

  return project.allTemplateNames.map(function (templateName) {
    var templateDir = _path2.default.join(project.nodeModulesDir, templateName);
    // we exclude package.json and config file because we want to merge them
    // and we exclude also files mentionned in the excludes item of the template
    // config
    var templateConfig = _this.getConfig(templateDir);
    var totalExcludedDirs = (templateConfig.excludedDirs || []).concat(['base_Dockerfile*', 'base_requirements*', 'package.json', '.gitignore', 'README.md', configFile, '\'_p_*\'']);
    var excludeOption = totalExcludedDirs.map(function (exclude) {
      return '--exclude=' + exclude;
    }).join(' ');
    return 'rsync -rv ' + excludeOption + ' ' + templateDir + '/ ' + project.dir;
  }).join(' && ');
}