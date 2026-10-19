const mark=(id)=>cy.task('capabilityEvidence',id,{log:false});
describe('Controlled capability acceptance',()=>{
 it('browser_interaction',()=>{
  cy.visit('/');cy.get('[data-cy=name]').type('Learner');cy.get('[data-cy=reveal]').click();
  cy.get('[data-cy=result]').should('have.text','Learner: practice_clue');
  cy.get('[data-cy=next]').click();cy.location('pathname').should('eq','/next');
  cy.get('h1').should('have.text','Second page');mark('browser_interaction');
 });
 it('page_inspection',()=>{
  cy.visit('/');cy.title().should('eq','Capability lab');
  cy.document().its('body').find('[data-cy=result]').should('exist');
  cy.get('[data-cy=name]').should('have.attr','maxlength','32');
  cy.screenshot('controlled-dom');mark('page_inspection');
 });
 it('network_observation',()=>{
  cy.intercept('POST','/api/clue').as('realClue');cy.visit('/');
  cy.get('[data-cy=name]').type('Learner');cy.get('[data-cy=reveal]').click();
  cy.wait('@realClue').then(({request,response})=>{
   expect(request.body).to.deep.equal({name:'Learner'});
   expect(response.statusCode).to.equal(200);
   expect(response.headers['x-lab-evidence']).to.equal('capability-fixture');
   expect(response.body).to.deep.equal({name:'Learner',clue:'practice_clue'});
  });
  cy.get('[data-cy=result]').should('have.text','Learner: practice_clue');mark('network_observation');
 });
 it('network_simulation',()=>{
  cy.intercept('POST','/api/clue',{statusCode:503,body:{error:'controlled-unavailable'}}).as('simulated');
  cy.visit('/');cy.get('[data-cy=name]').type('Learner');cy.get('[data-cy=reveal]').click();
  cy.wait('@simulated').its('response.statusCode').should('eq',503);
  cy.get('[data-cy=result]').should('have.text','API unavailable');mark('network_simulation');
 });
 it('direct_http',()=>{
  let browserIntercepts=0;
  cy.intercept('GET','/api/clue',()=>{browserIntercepts++;});
  cy.request('/api/clue').then(response=>{
   expect(response.status).to.equal(200);expect(response.body).to.deep.equal({clue:'practice_clue',source:'direct-http'});
   expect(browserIntercepts).to.equal(0);
  });mark('direct_http');
 });
 it('spy',()=>{
  cy.visit('/');cy.window().then(win=>cy.spy(win.lab,'notify').as('notifySpy'));
  cy.get('[data-cy=notify]').click();cy.get('@notifySpy').should('have.been.calledOnceWithExactly','ready');
  cy.get('[data-cy=notice]').should('have.text','ready');mark('spy');
 });
 it('stub',()=>{
  cy.visit('/');cy.window().then(win=>cy.stub(win.lab,'notify').as('notifyStub'));
  cy.get('[data-cy=notify]').click();cy.get('@notifyStub').should('have.been.calledOnceWithExactly','ready');
  cy.get('[data-cy=notice]').should('have.text','');mark('stub');
 });
 it('clock',()=>{
  cy.clock();cy.visit('/');cy.get('[data-cy=timer]').click();
  cy.get('[data-cy=timer-result]').should('have.text','waiting');cy.tick(999);
  cy.get('[data-cy=timer-result]').should('have.text','waiting');cy.tick(1);
  cy.get('[data-cy=timer-result]').should('have.text','complete');mark('clock');
 });
 it('EXPECTED_FAILURE_DIAGNOSTIC',()=>{
  cy.visit('/');cy.get('h1').should('have.text','INTENTIONAL_CAPABILITY_FAILURE');
 });
});
