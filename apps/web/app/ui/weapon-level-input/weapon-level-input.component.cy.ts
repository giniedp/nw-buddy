import { Component } from '@angular/core'
import { WeaponLevelInputComponent } from './weapon-level-input.component'
import { HttpClientModule } from '@angular/common/http'
import { TranslateModule } from '~/i18n'
import { NwDataService } from '~/nw'
import '@cypress/component'

@Component({
  standalone: true,
  template: `<nwb-weapon-level-input label="Label Text"></nwb-weapon-level-input>`,
  imports: [WeaponLevelInputComponent, HttpClientModule],
})
export class TestComponent {}

describe('WeaponLevelInputComponent', () => {
  it('renders input', () => {
    cy.mount(TestComponent, {
      imports: [
        TranslateModule.forRoot({
          loader: NwDataService,
        }),
      ],
    })
      .get('nwb-weapon-level-input')
      .should('exist')
  })
})
