import { HttpClientModule } from '@angular/common/http'
import { Component } from '@angular/core'
import '@cypress/component'
import { AppTestingModule } from '~/test'
import { DamageRowDetailComponent } from './damage-row-detail.component'

@Component({
  standalone: true,
  template: `<nwb-damage-row-detail [rowId]="'Gather1'"></nwb-damage-row-detail>`,
  imports: [DamageRowDetailComponent, HttpClientModule],
})
export class TestComponent {}

describe('DamageRowDetailComponent', () => {
  it('mounts', () => {
    cy.mount(TestComponent, {
      imports: [AppTestingModule],
    })
      .get('nwb-damage-row-detail')
      .should('exist')

    cy.get('nwb-property-grid')
      .should('exist')
  })
})
