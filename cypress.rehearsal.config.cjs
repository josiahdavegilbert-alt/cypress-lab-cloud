const {defineConfig} = require('cypress');
const fs = require('node:fs');
const {createRehearsalFixture} = require('./scripts/rehearsal-fixture.cjs');
const {CHECKS} = require('./scripts/rehearsal-policy.cjs');
module.exports = defineConfig({
  video: false, retries: 0, screenshotOnRunFailure: true, defaultCommandTimeout: 5000,
  pageLoadTimeout: 15000, requestTimeout: 5000, responseTimeout: 5000,
  e2e: {
    specPattern: 'cypress/rehearsal/competition.cy.js', supportFile: false, testIsolation: true,
    async setupNodeEvents(on, config) {
      const iteration = Number(config.env.rehearsalIteration);
      if (![1, 2].includes(iteration)) throw new Error('Use the fixed rehearsal runner');
      const fixture = createRehearsalFixture();
      await new Promise((resolve, reject) => { fixture.server.once('error', reject); fixture.server.listen(0, '127.0.0.1', resolve); });
      config.baseUrl = `http://127.0.0.1:${fixture.server.address().port}`;
      on('task', {
        resetRehearsal() { fixture.reset(); return null; },
        expireRehearsal() { fixture.expire(); return null; },
        recordRehearsalCheck(id) {
          if (!CHECKS.includes(id)) throw new Error('Unknown rehearsal check');
          fs.appendFileSync(`rehearsal-output/evidence-${iteration}.jsonl`, JSON.stringify({id, counters: {...fixture.counters}}) + '\n');
          return null;
        }
      });
      on('after:run', async () => { fixture.server.closeAllConnections(); await new Promise(resolve => fixture.server.close(resolve)); });
      return config;
    }
  }
});
