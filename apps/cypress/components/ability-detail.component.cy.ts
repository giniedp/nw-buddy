import { HttpClientModule } from '@angular/common/http'
import { Component } from '@angular/core'
import '@cypress/component'
import { AppTestingModule } from '~/test'
import { AbilityDetailComponent } from './ability-detail.component'

@Component({
  standalone: true,
  template: `<nwb-ability-detail [abilityId]="'Upgrade_WarHammer_ArmBreak_Rend'"></nwb-ability-detail>`,
  imports: [AbilityDetailComponent, HttpClientModule],
})
export class TestComponent {}

describe('AbilityDetailComponent', () => {
  it('mounts', () => {
    cy.mount(TestComponent, {
      imports: [AppTestingModule],
    })
      .get('nwb-ability-detail')
      .should('exist')

    cy.get('nwb-item-header-content')
      .should('exist')
      .should('contain.text', 'Lasting Trauma')
      .should('contain.text', 'Ability')
      .should('contain.text', 'Warhammer')
      .should('contain.text', 'Melee Damage')
  })
})
