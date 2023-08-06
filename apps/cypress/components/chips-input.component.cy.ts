import "@cypress/component"
import { ChipsInputComponent } from "./chips-input.component"
import { Component } from "@angular/core"

@Component({
  standalone: true,
  template: `<nwb-chips-input></nwb-chips-input>`,
  imports: [ChipsInputComponent]
})
export class TestComponent {

}

describe('ChipsInputComponent', () => {
  it('renders chips', () => {
    cy.mount(TestComponent)
      .get('[cy-chip]').should('not.exist')
      .get('nwb-chips-input').should('exist')
      .get('nwb-chips-input input').type('hello,world').blur()
      .get('[cy-chip]').should('have.length', 2)
      .get('[cy-chip=hello]').should('exist')
      .get('[cy-chip=world]').should('exist')
  })
})
