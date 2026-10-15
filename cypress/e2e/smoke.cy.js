describe('Public Cypress example smoke test', () => {
  it('loads the example page and verifies its heading', () => {
    cy.visit('/');
    cy.contains('h1', 'Kitchen Sink').should('be.visible');
  });
});
