import '@cypress/component'

import { AppTestingModule } from '~/test'
import { CraftingCalculatorComponent } from './crafting-calculator.component'

describe('CraftingCalculatorComponent', () => {
  beforeEach(() => {
    cy.viewport('iphone-6')
  })
  it('IngotT51', () => {
    cy.mount(CraftingCalculatorComponent, {
      imports: [AppTestingModule],
      componentProperties: {
        recipeId: 'IngotT51',
        amount: 10,
        amountMode: 'gross',
      },
    })

    cy.get('input[data-cy="amount"]').should('have.value', 10)
    cy.get('nwb-crafting-step [data-cy="step"]')
      .first()
      .within(() => {
        cy.get('[data-cy="name"]').should('contain.text', 'Asmodeum')
        cy.get('[data-cy="amount"]').should('contain.text', 10)
      })

    cy.get('nwb-crafting-step [data-cy="step children"]')
      .first()
      .within(() => {
        cy.get('nwb-crafting-step').should('have.length', 5)
      })
  })

  it('Scarab_CON_Light_Ele_Chest_ClothT5', () => {
    cy.mount(CraftingCalculatorComponent, {
      imports: [AppTestingModule],
      componentProperties: {
        recipeId: 'Scarab_CON_Light_Ele_Chest_ClothT5',
      },
    })
  })
})
