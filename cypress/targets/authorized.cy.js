describe('Authorized CTF homepage compatibility', () => {
  it('loads the authorized homepage and renders a document', () => {
    cy.intercept('GET', 'https://20260914.gm.neu-ctf.club/').as('homepage');
    cy.visit('/');
    cy.wait('@homepage').then(({ response }) => {
      expect(response, 'homepage response').to.exist;
      expect(response.statusCode, 'homepage HTTP status').to.be.within(200, 299);
    });
    cy.location('origin').should('equal', 'https://20260914.gm.neu-ctf.club');
    cy.get('body').should('be.visible');
    cy.get('body').children().should('have.length.greaterThan', 0);
  });
});
