describe('housing', () => {
  beforeEach(() => {

  })

  it('should list housing items and allow navigation',() => {
    cy.visit('/housing')
      .get('nwb-housing-page')
      .should('exist')
      .get('nwb-housing-detail-page')
      .should('not.exist')

    cy.get('nwb-quicksearch-input')
      .within(() => {
        cy.get('input.input').type("ancient trophy")
      })
      .get('.ag-cell[col-id="name"]')
      .should('contain.text', "Ancient Combat Trophy")
      .first()
      .click()
      .get('nwb-housing-detail-page')
      .should('exist')
  })

})
