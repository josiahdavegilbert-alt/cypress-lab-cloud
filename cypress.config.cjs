const { defineConfig } = require('cypress');
module.exports = defineConfig({
  video: false,
  retries: 0,
  e2e: {
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.js',
    baseUrl: 'https://example.cypress.io'
  }
});
