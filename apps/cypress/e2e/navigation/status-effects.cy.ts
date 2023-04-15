describe('status-effects', () => {
  beforeEach(() => {

  })

  it('should list status-effects and allow navigation',() => {
    cy.visit('/status-effects')
      .get('nwb-status-effects-page')
      .should('exist')
      .get('nwb-status-effects-detail-page')
      .should('not.exist')

    cy.get('nwb-quicksearch-input')
      .within(() => {
        cy.get('input.input').type("empower")
      })
      .get('.ag-cell[col-id="name"]')
      .should('contain.text', "Empower")
      .first()
      .click()
      .get('nwb-status-effects-detail-page')
      .should('exist')
  })

})
