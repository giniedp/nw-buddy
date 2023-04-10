describe('crafting', () => {
  beforeEach(() => {

  })

  it('should list crafting items and allow navigation',() => {
    cy.visit('/crafting')
      .get('nwb-crafting-page')
      .should('exist')
      .get('nwb-crafting-detail-page')
      .should('not.exist')

    cy.get('nwb-quicksearch-input')
      .within(() => {
        cy.get('input.input').type("Asmodeum")
      })
      .get('.ag-cell[col-id="name"]')
      .should('contain.text', "Asmodeum")
      .first()
      .click()
      .get('nwb-crafting-detail-page')
      .should('exist')
  })

})
