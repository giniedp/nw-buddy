import "@cypress/component"
import { ChipsInputComponent } from "./chips-input.component"

describe('StepperComponent', () => {
  it('mounts', () => {
    cy.mount(ChipsInputComponent, {
      imports: [ChipsInputComponent]
    })
  })
})
