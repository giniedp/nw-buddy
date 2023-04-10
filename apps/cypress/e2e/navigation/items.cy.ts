describe('items', () => {
  beforeEach(() => {

  })

  it('should show list items and allow navigation',() => {
    cy.visit('/items')
      .get('nwb-items-page')
      .should('exist')
      .get('nwb-item-page')
      .should('not.exist')

    cy.get('nwb-quicksearch-input')
      .within(() => {
        cy.get('input.input').type("expedition captain's breastplate")
      })
      .get('.ag-cell[col-id="name"]')
      .should('contain.text', "Expedition Captain's Breastplate")
      .first()
      .click()
      .get('nwb-item-page')
      .should('exist')
  })

})
