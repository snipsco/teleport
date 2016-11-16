import childProcess from 'child_process'
import fs from 'fs'
import { values } from 'lodash'
import path from 'path'

import { formatString } from '../utils'

const notLocalhostPlaceholderFiles = [
  'controller.yaml',
  'Dockerfile',
  'service.yaml'
]

export function install () {
  this.getLevelMethod('install')()
  this.consoleInfo(`install was successful !`)
}

export function installProject () {
  const { backend, project: { package: { name } } } = this
  this.consoleInfo(`Let\'s install this ${name} project !`)
  if (backend) {
    this.installBackend()
  }
  this.consoleInfo('project install done !')
}

export function installBackend () {
  this.installScript()
  this.installKubernetes()
  this.installPythonVenv()
  this.installAppPythonLib()
  this.installBasePlaceholderFiles()
  this.installBaseServers()
  this.installPorts()
  this.setAllTypesAndServersEnvironment()
  this.installPlaceholderFiles()
  this.installServers()
  this.installSecrets()
  this.write(this.project)
}

export function installScript () {
  const command = `cd ${this.project.dir} && npm run install`
  this.consoleInfo('Let\'s install the project')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installKubernetes () {
  this.consoleInfo('Let\'s install kubernetes configs')
  const command = this.getInstallKubernetesCommand()
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
  this.consoleInfo('kubernetes configs are installed !')
}

export function getInstallKubernetesCommand () {
  this.checkProject()
  const { project: { config: { backend: { masterHost } }, dir } } = this
  if (typeof masterHost !== 'string') {
    this.consoleError('You must define a masterHost for kubectl')
  }
  let commands = [`cd ${path.join(dir, 'bin')}`]
  commands.push(`kubectl config set-cluster master --server=http://${masterHost}:8080`)
  commands.push('kubectl config set-context master --cluster=master')
  commands.push('kubectl config use-context master')
  commands.push('kubectl get nodes')
  return commands.join(' && ')
}

export function installDocker () {
  const { project } = this
  const dockerVersionDigit = parseInt(childProcess
    .execSync('docker version --format \'{{.Client.Version}}\'')
    .toString('utf-8')
    .replace(/(\.+)/g, ''))
  const projectDockerVersion = project.config.backend.dockerVersion
  const projectDockerVersionDigit = parseInt(projectDockerVersion
    .replace(/(\.+)/g, ''))
  if (dockerVersionDigit > projectDockerVersionDigit) {
    const dockerFile = `docker-${project.dockerVersion}`
    const command = [
      `exec wget https://get.docker.com/builds/Darwin/x86_64/${projectDockerVersion}`,
      `cp ${dockerFile} $(which docker)`,
      `rm ${dockerFile}`
    ].join(' && ')
    this.consoleInfo(`Let\'s install a good docker version, that one : ${projectDockerVersion}`)
    this.consoleLog(command)
    childProcess.execSync(command)
  }
}

export function getInstallVenvCommand () {
  this.checkProject()
  const { project, program } = this
  let option = ''
  if (program.lib === 'global') {
    option = '--system-site-packages'
  }
  return `cd ${project.dir} && virtualenv -p ${project.config.python} venv ${option}`
}

export function installPythonVenv () {
  const { program } = this
  if (program.lib === 'global') {
    return
  }
  this.consoleInfo('...Installing a python venv for our backend')
  const command = this.getInstallVenvCommand()
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installAppPythonLib () {
  const { program, project } = this
  if (program.lib === 'local') {
    this.setActivatedPythonVenv()
  }
  this.consoleInfo('... Installing the python lib necessary for the teleport app')
  const command = `cd ${project.dir} && ${project.config.pip} install -r requirements.txt`
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installBasePlaceholderFiles () {
  const { program } = this
  program.image = 'base'
  program.method = null
  program.methods = [
  ].map(newProgram => () => {
    Object.assign(program, newProgram)
    this.installPlaceholderFile()
  })
  this.mapInTypesAndServers()
}

export function installBaseServers () {
  const { program } = this
  program.image = 'base'
  program.method = 'installServer'
  program.methods = null
  program.type = 'localhost'
  this.setTypeEnvironment()
  this.mapInServers()
}

export function installServer () {
  const { program, server } = this
  const commands = []
  let fileName = 'install.sh'
  if (program.image && typeof program.image !== 'undefined') {
    fileName = `${program.image}_${fileName}`
  }
  fileName = `localhost_${fileName}`
  this.consoleInfo(`Let\'s launch the ${fileName} needed in the docker server... it can\'t take a long time`)
  // for now for settings like Xcode8 with ElCaptai uwsgi in venv install breaks, and only solution is
  // to do that with sudo
  commands.push(`cd ${server.dir}`)
  commands.push(`${program.permission} sh scripts/${fileName}`)
  const command = commands.join(' && ')
  this.consoleLog(command)
  console.log(childProcess.execSync(command).toString('utf-8'))
}

export function installPorts () {
  this.checkProject()
  this.checkWeb()
  const { project: { config, dir } } = this
  this.availablePortsBySubDomain = {}
  values(config.typesByName)
  .forEach(type => {
    if (type.subDomain) {
      this.availablePortsBySubDomain[type.subDomain] = this.getAvailablePorts(type.subDomain)
    }
  })
  if (config.backend && config.backend.serversByName) {
    Object.keys(config.backend.serversByName)
      .forEach((serverName, index) => {
        const server = config.backend.serversByName[serverName]
        Object.keys(config.typesByName).forEach(typeName => {
          let run = server.runsByTypeName[typeName]
          if (typeof run === 'undefined') {
            run = server.runsByTypeName[typeName] = {}
          }
          const subDomain = run.subDomain || config.typesByName[typeName].subDomain
          if (typeof subDomain === 'undefined') {
            return
          }
          if (this.availablePortsBySubDomain[subDomain]) {
            const availablePorts = this.availablePortsBySubDomain[subDomain]
            if (availablePorts.length < 1) {
              this.consoleWarn('Unfortunately, there are not enough available ports for your services... You need to get some as free before.')
              process.exit()
            }
            run.port = availablePorts[0].toString()
            this.availablePortsBySubDomain[subDomain] = availablePorts.slice(1)
          }
        })
      })
  }
  this.writeConfig(dir, config)
}

export function installPlaceholderFiles () {
  const { program } = this
  this.setAllTypesAndServersEnvironment()
  program.image = undefined
  program.method = null
  program.methods = [
    'service.yaml',
    'controller.yaml',
    'client_secret.json',
    'uwsgi.ini',
    'guwsgi.ini'
  ].map(file => {
    return {
      folder: 'config',
      file: file
    }
  }).concat([
    'install.sh',
    'start.sh'
  ].map(file => {
    return {
      folder: 'scripts',
      file: file
    }
  })).concat([
    'Dockerfile'
  ].map(file => {
    return {
      folder: 'server',
      file: file
    }
  })).map(newProgram => () => {
    Object.assign(program, newProgram)
    this.installPlaceholderFile()
  })
  this.mapInTypesAndServers()
}

const templatePrefix = '_p_'

export function installPlaceholderFile () {
  this.checkProject()
  const { backend, program, run, server, type } = this
  // check
  if (!backend || !run || !server || !type ||
    (type.name === 'localhost' && notLocalhostPlaceholderFiles.includes(program.file))
  ) { return }
  // set the file name
  let installedFileName = program.file
  let typePrefix
  if (program.image && typeof program.image !== 'undefined') {
    installedFileName = `${program.image}_${installedFileName}`
  }
  if (type) {
    typePrefix = `${type.name}_`
    installedFileName = `${typePrefix}${installedFileName}`
  }
  // look first if there is no specific <type>_<image>_<script> template
  let templateFile
  let templateFileName = installedFileName
  const templateFolderDir = program.folder === 'server'
  ? server.templateServerDir
  : path.join(server.templateServerDir, program.folder)
  templateFileName = `${templatePrefix}${templateFileName}`
  let templateFileDir = path.join(templateFolderDir, templateFileName)
  if (fs.existsSync(templateFileDir)) {
    templateFile = fs.readFileSync(templateFileDir, 'utf-8')
  } else {
    // remove the type prefix then to find a general <image>_<script> template
    templateFileName = templateFileName.slice(templatePrefix.length + typePrefix.length)
    templateFileName = `${templatePrefix}${templateFileName}`
    templateFileDir = path.join(templateFolderDir, templateFileName)
    if (fs.existsSync(templateFileDir)) {
      templateFile = fs.readFileSync(templateFileDir, 'utf-8')
    } else {
      return
    }
  }
  const installedFolderDir = program.folder === 'server'
  ? server.dir
  : path.join(server.dir, program.folder)
  const installedFileDir = path.join(installedFolderDir, installedFileName)
  // prepare the dockerExtraConfig
  const extraConfig = Object.assign(
    {
      'DOCKER_HOST': run.host,
      'PORT': run.port,
      'SITE_NAME': backend.siteName,
      'TYPE': type.name,
      'URL': run.url,
      'WEB': 'on'
    },
    backend.dockerEnv,
    server.dockerEnv
  )
  this.dockerExtraConfig = Object.keys(extraConfig)
    .map(key => `ENV ${key} ${extraConfig[key]}`).join('\n')
  this.manageExtraConfig = Object.keys(extraConfig)
    .map(key => `export ${key}=${extraConfig[key]}`).join(' && ')
  if (this.manageExtraConfig.length > 0) {
    this.manageExtraConfig = `${this.manageExtraConfig} &&`
  }
  // info
  this.consoleInfo(`Let\'s install this placeholder file ${installedFileDir}`)
  // replace
  fs.writeFileSync(installedFileDir, formatString(templateFile, this))
}

export function installServers () {
  const { program } = this
  program.image = undefined
  program.method = 'installServer'
  program.methods = null
  program.type = 'localhost'
  this.setTypeEnvironment()
  this.mapInServers()
}

export function installSecrets () {
  const { program } = this
  program.base = null
  program.method = 'installSecret'
  program.methods = null
  this.mapInServers()
}

export function installSecret () {
  const { server } = this
  // configure maybe an empty secret
  const secretDir = path.join(server.dir, 'config/secret.json')
  if (!fs.existsSync(secretDir)) {
    fs.writeFileSync(secretDir, '{}')
  }
}
