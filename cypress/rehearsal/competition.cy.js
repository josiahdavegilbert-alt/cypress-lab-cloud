const sample = 'practice-evidence\n';
const mark = id => cy.task('recordRehearsalCheck', id, {log: false});
function login(id) {
  cy.session(['practice-ui', id], () => {
    cy.visit('/login');
    cy.get('[data-cy=user]').type('practice-competitor');
    cy.get('[data-cy=login]').submit();
    cy.location('pathname').should('eq', '/challenge');
    cy.get('h1').should('have.text', 'Authorized practice challenge');
  }, {
    validate() { cy.request({url: '/api/session', failOnStatusCode: false, log: false}).its('status').should('eq', 200); }
  });
}
describe('Controlled competition rehearsal', () => {
  beforeEach(() => cy.task('resetRehearsal', null, {log: false}));
  it('anonymous_access', () => {
    cy.request({url: '/api/clue', failOnStatusCode: false}).its('status').should('eq', 401);
    mark('anonymous_access');
  });
  it('login_session_restore', () => {
    login('restore'); cy.clearCookies(); login('restore');
    cy.intercept('GET', '/api/clue').as('clue');
    cy.visit('/challenge'); cy.get('[data-cy=load]').click();
    cy.wait('@clue').then(({response}) => { expect(response.statusCode).to.eq(200); expect(response.body).to.deep.equal({clue: 'practice_clue'}); });
    cy.get('[data-cy=clue]').should('have.text', 'practice_clue'); mark('login_session_restore');
  });
  it('session_recovery', () => {
    login('recovery'); cy.task('expireRehearsal', null, {log: false}); login('recovery');
    cy.visit('/challenge'); cy.get('h1').should('have.text', 'Authorized practice challenge'); mark('session_recovery');
  });
  it('state_isolation', () => {
    cy.getAllCookies({log: false}).should('be.empty');
    cy.request({url: '/api/clue', failOnStatusCode: false}).its('status').should('eq', 401); mark('state_isolation');
  });
  it('bounded_dom_evidence', () => {
    cy.visit('/dom'); cy.title().should('eq', 'Practice rehearsal');
    cy.get('[data-cy=clue]').should('not.be.visible').and('have.attr', 'data-source', 'controlled');
    cy.get('[data-cy=reveal]').click(); cy.get('[data-cy=clue]').should('be.visible').and('have.text', 'practice_clue');
    cy.screenshot('rehearsal-dom'); mark('bounded_dom_evidence');
  });
  it('upload_download', () => {
    login('files'); cy.visit('/challenge');
    cy.intercept('POST', '/api/upload').as('upload');
    cy.get('[data-cy=file]').selectFile({contents: Cypress.Buffer.from(sample), fileName: 'practice.txt', mimeType: 'text/plain'});
    cy.get('[data-cy=upload]').click();
    cy.wait('@upload').then(({response}) => { expect(response.statusCode).to.eq(200); expect(response.body.bytes).to.eq(Cypress.Buffer.byteLength(sample)); expect(response.body.sha256).to.match(/^[a-f0-9]{64}$/); });
    cy.get('[data-cy=upload-result]').should('have.text', `${Cypress.Buffer.byteLength(sample)} bytes accepted`);
    cy.get('[data-cy=download]').click();
    cy.readFile(`${Cypress.config('downloadsFolder')}/practice-artifact.txt`, null).should('deep.equal', Cypress.Buffer.from(sample));
    cy.screenshot('rehearsal-files'); mark('upload_download');
  });
  it('error_recovery', () => {
    login('errors'); cy.visit('/challenge');
    cy.intercept({method: 'GET', pathname: '/api/clue', times: 1}, {statusCode: 503, body: {error: 'controlled-unavailable'}}).as('unavailable');
    cy.get('[data-cy=load]').click(); cy.wait('@unavailable').its('response.statusCode').should('eq', 503);
    cy.get('[data-cy=clue]').should('have.text', 'Temporarily unavailable');
    cy.intercept('GET', '/api/clue').as('recovered');
    cy.get('[data-cy=load]').click(); cy.wait('@recovered').its('response.statusCode').should('eq', 200);
    cy.get('[data-cy=clue]').should('have.text', 'practice_clue'); mark('error_recovery');
  });
});
