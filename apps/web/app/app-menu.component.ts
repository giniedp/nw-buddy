import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonSegment, IonSegmentButton, IonToolbar, SegmentCustomEvent } from '@ionic/angular/standalone'
import { patchState, signalState } from '@ngrx/signals'
import { APP_MENU } from './app-menu'
import { NwModule } from './nw'
import { IconsModule } from './ui/icons'
import { svgChevronLeft } from './ui/icons/svg'
import { LayoutModule } from './ui/layout'
import { MenuCloseDirective } from './ui/layout/menu.directive'

@Component({
  standalone: true,
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  imports: [
    CommonModule,
    NwModule,
    IconsModule,
    RouterModule,
    LayoutModule,
    IonToolbar,
    IonSegment,
    IonSegmentButton,
    MenuCloseDirective,
  ],
  host: {
    class: 'ion-page',
  },
})
export class AppMenuComponent {
  private state = signalState({
    menu: APP_MENU,
    active: APP_MENU[0].category,
  })
  protected get menu() {
    return this.state.menu()
  }

  protected get active() {
    return this.state.active()
  }

  protected readonly chevronIcon = svgChevronLeft

  protected onGroupActive(category: string) {
    patchState(this.state, { active: category })
  }

  protected handleSegmentChange(event: SegmentCustomEvent) {
    patchState(this.state, { active: event.detail.value as any })
  }
}
