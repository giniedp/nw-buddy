describe('perks', () => {
  beforeEach(() => {

  })

  it('should list perks and allow navigation',() => {
    cy.visit('/perks')
      .get('nwb-perks-page')
      .should('exist')
      .get('nwb-perks-detail-page')
      .should('not.exist')

    cy.get('nwb-quicksearch-input')
      .within(() => {
        cy.get('input.input').type("refreshing move")
      })
      .get('.ag-cell[col-id="name"]')
      .should('contain.text', "Refreshing Move")
      .first()
      .click()
      .get('nwb-perks-detail-page')
      .should('exist')
  })

})
