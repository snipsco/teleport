// GET UTILITY
// You have here all the internal getter methods helping
// the Teleport app to work. Also you the get utility
// that helps you to console a variable of your project state.
// For instance you can type 'tpt get --kwarg project.config'
// (but see the tests for further example) to know the config
// of your app.

import childProcess from 'child_process'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import stringify from 'json-stable-stringify'

import { getPackage, toTitleCase } from '../utils/functions'

export function get () {
  this.setKwarg()
  const getValue = this.kwarg === '.'
  ? this
  : _.get(this, this.kwarg)
  this.getString = stringify(getValue, {space: ' '})
  console.log(this.getString)
  return getValue
}

export function getConfig (dir) {
  const { app: { configFile, package: {name} } } = this
  let config
  // check first for some attributes in package.json
  const localPackage = getPackage(dir)
  if (localPackage && localPackage[name]) {
    config = _.merge({}, localPackage[name])
  }
  // then merge the config if it already exists
  const configDir = path.join(dir, configFile)
  if (fs.existsSync(configDir)) {
    config = _.merge(config, JSON.parse(fs.readFileSync(configDir)))
  }
  // return
  return config
}

export function getProjectsByName () {
  const { app: { dir } } = this
  const fileDir = path.join(dir, '.projects.json')
  if ( !fs.existsSync(fileDir) ) {
    fs.writeFileSync(fileDir, '{}')
  }
  return JSON.parse(fs.readFileSync(fileDir))
}

export function getAvailablePorts (docker) {
  const { app, run } = this
  docker = docker || run.docker
  let command = `python ${app.pythonDir} ports --filter available --docker ${docker}`
  if (app.venvDir) {
    command = `source ${app.venvDir}/bin/activate && ${command}`
  }
  const rep = childProcess.execSync(command).toString('utf-8')
  const ports = JSON.parse('[' + rep.split('[').slice(-1)[0])
  return ports
}

export function getTemplatesOption () {
  const { project, program } = this
  let templatesOptions = []
  if (typeof program.templates !== 'undefined' && program.templates.trim() !== '') {
    templatesOptions = program.templates.split(',')
  } else if (project.config && project.config.templateNames) {
    templatesOptions = project.config.templateNames
  }
  return templatesOptions.join(' ')
}

export function getTemplateNames () {
  let templatesOption = this.getTemplatesOption()
  return templatesOption.split(' ')
    .map(template => template.split('@')[0])
    .filter(templateName => templateName.trim() !== '')
}

export function getDepTemplateNames (templateName, depTemplateNames = []) {
  const { project } = this
  const templateDir = path.join(project.dir, 'node_modules', templateName)
  let templateConfig = this.getConfig(templateDir)
  const templatePackage = getPackage(templateDir)
  if (templatePackage && templateConfig) {
    depTemplateNames.push(templateName)
    const dependencies = Object.assign({}, templatePackage.dependencies, templatePackage.devDependencies)
    Object.keys(dependencies)
      .forEach(depTemplateName =>
        this.getDepTemplateNames(depTemplateName, depTemplateNames)
      )
  }
  return depTemplateNames
}

export function getAllTemplateNames () {
  const { project: { config: { templateNames } } } = this
  return _.uniq(_.flatten(
    templateNames.map(templateName => this.getDepTemplateNames(templateName))
  ))
}

export function getPlatformTemplates () {
  const { project: { config, dir, nodeModulesDir } } = this
  return config.templateNames.filter(templateName => {
    const templateDir = path.join(nodeModulesDir, templateName)
    return this.getConfig(templateDir).isPlatform
  })
}

export function getTemplateDependencies () {
  const { project: { config, dir } } = this
  return _.fromPairs(config.templateNames
    .map(template => {
      let [templateName, templateVersion] = template.split('@')
      const templateDir = path.join(dir, 'node_modules', templateName)
      templateVersion = templateVersion || getPackage(templateDir).version
      return [templateName, templateVersion]
    }))
}

export function getUrls () {
  this.program = Object.assign(this.program, {
    get: true,
    kwarg: 'run.url',
    method: 'get'
  })
  this.mapInServers()
  return this.getString
}

export function getAllUrls () {
  this.program = Object.assign(this.program, {
    get: true,
    kwarg: 'run.url',
    method: 'get'
  })
  this.mapInTypesAndServers()
  return this.getString
}
