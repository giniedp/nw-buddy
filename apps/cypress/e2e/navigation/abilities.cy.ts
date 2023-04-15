describe('abilities', () => {
  beforeEach(() => {

  })

  it('should list abilities and allow navigation',() => {
    cy.visit('/abilities')
      .get('nwb-abilities-page')
      .should('exist')
      .get('nwb-abilities-detail-page')
      .should('not.exist')

    cy.get('nwb-quicksearch-input')
      .within(() => {
        cy.get('input.input').type("flourish")
      })
      .get('.ag-cell[col-id="name"]')
      .should('contain.text', "Flourish and Finish")
      .first()
      .click()
      .get('nwb-abilities-detail-page')
      .should('exist')
  })

})
