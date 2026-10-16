const { defineConfig } = require('cypress');
const fs = require('node:fs');
const path = require('node:path');
module.exports = defineConfig({
  video: false,
  retries: 0,
  screenshotOnRunFailure: true,
  screenshotsFolder: 'cypress/screenshots/acceptance',
  defaultCommandTimeout: 4000,
  e2e: {
    specPattern: 'cypress/acceptance/**/*.cy.js',
    supportFile: false,
    setupNodeEvents(on) {
      on('task', {
        evidence(value) {
          if (value?.method !== 'POST' || value?.path !== '/api/clue' || value?.status !== 200 || value?.header !== 'controlled-fixture' || value?.request?.name !== 'Josiah' || value?.response?.name !== 'Josiah' || value?.response?.clue !== 'practice_clue') throw new Error('Unexpected controlled-fixture evidence');
          const selected = { method: 'POST', path: '/api/clue', request: { name: 'Josiah' }, status: 200, header: 'controlled-fixture', response: { name: 'Josiah', clue: 'practice_clue' } };
          fs.appendFileSync(path.join(process.cwd(), 'acceptance-network.jsonl'), JSON.stringify(selected) + '\n');
          return null;
        }
      });
    }
  }
});
