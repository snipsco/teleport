import { getPackage } from '../utils'

export function init (program) {
  this.program = program
  const app = this.app = {}
  this.setAppEnvironment()
  this.level = null // has to be after either scope or project
  const project = this.project = {}
  const scope = this.scope = {}
  if (app.currentScope && typeof app.currentScope !== 'undefined') {
    scope.dir = app.currentScope.dir
  }

  // determine where we are
  this.currentDir = process.cwd()
  // if we are inside of the app folder itself better is to leave, because
  // we don't have anything to do here
  this.isAppDir = this.currentDir === app.dir.replace(/\/$/, '')
  if (this.isAppDir) {
    this.consoleWarn(`You are in the ${app.package.name} folder... Better is to exit :)`)
    process.exit()
  }
  // if we want to create something, then we return because we are not in a scope or in a project yet
  if (typeof program.create !== 'undefined') {
    this.level = ['scope', 'project'].find(level => program[level])
    return
  }
  // if it is not a create method, it means that we are either in a scope or in a
  // project to do something
  this.currentConfig = this.getConfig(this.currentDir)
  // split given where we are
  if (this.currentConfig) {
    if (this.currentConfig.isScope === true) {
      this.level = 'scope'
      scope.dir = this.currentDir
      this.setScopeEnvironment()
    } else if (getPackage(this.currentDir)) {
      const scopeName = this.currentConfig.scope.name
      const appScope = app.config.scopesByName[this.currentConfig.scope.name]
      if (scope) {
        scope.dir = appScope.dir
        this.setScopeEnvironment()
        this.level = 'project'
        project.dir = this.currentDir
        this.setProjectEnvironment()
      } else {
        this.consoleWarn(`weird this project is attached to ${scopeName} but there is no such scope in the app`)
      }
    }
  }
  // exit else
  if (!this.level) {
    this.consoleWarn('You neither are in a scope folder or in a project folder')
    process.exit()
  }
}
