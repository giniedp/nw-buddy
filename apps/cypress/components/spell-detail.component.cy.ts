import { HttpClientModule } from '@angular/common/http'
import { Component } from '@angular/core'
import '@cypress/component'
import { AppTestingModule } from '~/test'
import { SpellDetailComponent } from './spell-detail.component'

@Component({
  standalone: true,
  template: `<nwb-spell-detail [spellId]="'Withered_Feculent_PustulePop'"></nwb-spell-detail>`,
  imports: [SpellDetailComponent, HttpClientModule],
})
export class TestComponent {}

describe('AbilityDetailComponent', () => {
  it('mounts', () => {
    cy.mount(TestComponent, {
      imports: [AppTestingModule],
    })
      .get('nwb-spell-detail')
      .should('exist')

    cy.get('nwb-property-grid')
      .should('exist')
  })
})
