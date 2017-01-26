import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'

// CREATE TASK
// this is the first task you can call from teleport to build  project.
// - it decides if the name of the project is good set
// (and if not, it will give you one random)
// - it checks if there is folder with the same project name here.
// - it checks if there are no such project already refered into the .projects.json
// of your teleport
// - it create your folder that will contain the file system
// - it calls the sub tasks init

export function create () {
  this.getLevelMethod('create')()
  this.consoleInfo('Your teleport create was sucessful !')
}

export function createProject () {
  // unpack
  const { app, project, program } = this
  // check if such a project exists already here
  project.dir = path.join(this.currentDir, program.project)
  this.consoleInfo(`wait a second... We create your ${program.project} project !`)
  if (fs.existsSync(project.dir)) {
    this.consoleWarn(`There is already a ${program.project} here...`)
    process.exit()
  }
  const projectsByName = app.projectsByName
  const previousProject = projectsByName[program.project]
  if (previousProject) {
    this.consoleWarn(`There is already a ${program.project} here ${previousProject.dir}...`)
    process.exit()
  }
  projectsByName[program.project] = {
    dir: project.dir
  }
  this.writeProjectsByName(projectsByName)
  // mkdir the folder app
  childProcess.execSync(`mkdir -p ${program.project}`)
  // write default package
  this.init()
  // info
  this.consoleInfo(`Your ${program.project} was successfully created, go inside with \'cd ${program.project}\' !`)
}
