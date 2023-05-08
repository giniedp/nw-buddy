import "@cypress/component"

import { Component } from "@angular/core"
import { BrowserAnimationsModule } from "@angular/platform-browser/animations"
import { AppTestingModule } from "~/test"
import { CraftingStepToggleComponent } from "./crafting-step-toggle.component"
import { FormsModule } from "@angular/forms"

@Component({
  standalone: true,
  template: `<nwb-crafting-step-toggle [(ngModel)]="value"></nwb-crafting-step-toggle>`,
  imports: [CraftingStepToggleComponent, FormsModule]
})
export class TestComponent {
  public value: boolean
}

describe('CraftingStepToggleComponent', () => {
  beforeEach(() => {
    cy.mount(TestComponent, {
      imports: [AppTestingModule, BrowserAnimationsModule]
    })
  })

  it('mounts', () => {
    cy.get('nwb-crafting-step-toggle').should('exist')
  })
})
