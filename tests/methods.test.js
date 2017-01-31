const childProcess = require('child_process')
const _ = require('lodash')

const Teleport = require('../lib').default
const {
  TEST_APP_NAME,
  TEST_TEMPLATES,
  TEST_APP_DIR
} = require('./test.config.js')

test('execute utility method with getProjectsByName', () => {
  // equivalent as 'tpt -e --method getProjectsByName'
  let testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    exec: true,
    method: 'getProjectsByName'
  })
  let expectedValue = testTeleport.launch()
  // we expect that the test project is stored in the projects.json
  expect(typeof expectedValue[TEST_APP_NAME]).toBe('object')
})

/*
test('get utility method', () => {
  // equivalent as 'tpt -g --kwarg project.config'
  const testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    get: true,
    kwarg: 'project.config'
  })
  const expectedValue = testTeleport.launch()
  // we expect the config to have the templateNames array with the good templates
  expect(expectedValue.templateNames).toEqual(TEST_TEMPLATES.split(','))
})

test('map utility method for installing', () => {
  // equvalent as 'tpt map --method install --collections project.config.backend.serversByName'
  const testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    collections: 'project.config.backend.serversByName',
    map: true,
    method: 'install'
  }).launch()
})

test('map utility method for getting the run infos', () => {
  // equvalent as 'tpt map --method get --kwarg run --collections project.config.typesByName,project.config.backend.serversByName'
  const testTeleport = new Teleport({
    dir: TEST_APP_DIR,
    collections: 'project.config.typesByName,project.config.backend.serversByName',
    map: true,
    method: 'get',
    kwarg: 'run'
  })
  const expectedValue = testTeleport.launch()
  // we expect to have all the tags for each type and each server
  expect(_.flatten(expectedValue).map(run => run.tag)).toEqual([
    `localhost-${TEST_APP_NAME}-wbr`,
    `localhost-${TEST_APP_NAME}-wbs`,
    `${TEST_APP_NAME}-wbr`,
    `${TEST_APP_NAME}-wbs`,
    `stg-${TEST_APP_NAME}-wbr`,
    `stg-${TEST_APP_NAME}-wbs`
  ])
})
*/

// Here we stop the tests for the jenkins part
// But for a user, it is still needed to test a start and a deploy
// command
if (process.env.JEST_TESTER !== 'jenkins') {
  // equivalent as 'tpt -s'
  /*
  test('start task', () => {
    const testTeleport = new Teleport({
      dir: TEST_APP_DIR,
      start: true
    })
    testTeleport.launch()
  })
  */
  // equivalent as 'tpt -d'
  test('deploy task', () => {
    const testTeleport = new Teleport({
      dir: TEST_APP_DIR,
      deploy: true
    })
    testTeleport.launch()
    console.log(childProcess
      .execSync(`heroku apps:destroy ${TEST_APP_NAME} --confirm ${TEST_APP_NAME}`)
    )
  })
}
