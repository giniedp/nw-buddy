import { HttpClientModule } from '@angular/common/http'
import { Component } from '@angular/core'
import '@cypress/component'
import { AppTestingModule } from '~/test'
import { GameEventDetailComponent } from './game-event-detail.component'

@Component({
  standalone: true,
  template: `<nwb-game-event-detail [eventId]="'Gather1'"></nwb-game-event-detail>`,
  imports: [GameEventDetailComponent, HttpClientModule],
})
export class TestComponent {}

describe('GameEventDetailComponent', () => {
  it('mounts', () => {
    cy.mount(TestComponent, {
      imports: [AppTestingModule],
    })
      .get('nwb-game-event-detail')
      .should('exist')

    cy.get('nwb-property-grid')
      .should('exist')
  })
})
