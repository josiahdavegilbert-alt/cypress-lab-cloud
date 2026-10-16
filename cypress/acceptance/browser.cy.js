describe('Controlled browser acceptance', () => {
  it('types, clicks and renders a real API response', () => {
    cy.intercept('POST', '/api/clue').as('clue');
    cy.visit('/');
    cy.get('[data-cy=name]').type('Josiah');
    cy.get('[data-cy=reveal]').click();
    cy.wait('@clue').then(({ request, response }) => {
      expect(request.body).to.deep.equal({ name: 'Josiah' });
      expect(response.statusCode).to.equal(200);
      expect(response.headers['x-lab-evidence']).to.equal('controlled-fixture');
      expect(response.body).to.deep.equal({ clue: 'practice_clue', name: 'Josiah' });
      cy.task('evidence', { method: request.method, path: '/api/clue', request: { name: request.body.name }, status: response.statusCode, header: response.headers['x-lab-evidence'], response: response.body });
      cy.get('[data-cy=result]').should('have.text', 'Josiah: practice_clue');
    });
  });
  it('navigates to a second page', () => {
    cy.visit('/');
    cy.get('[data-cy=next]').click();
    cy.location('pathname').should('equal', '/next');
    cy.get('h1').should('have.text', 'Second page');
  });
  it('EXPECTED_FAILURE_DIAGNOSTIC', () => {
    cy.visit('/');
    cy.get('h1').should('have.text', 'INTENTIONAL_MISMATCH');
  });
});
