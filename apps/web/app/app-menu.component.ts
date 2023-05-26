import { CommonModule } from '@angular/common'
import { AfterViewInit, Component, QueryList, ViewChildren } from '@angular/core'
import { ActivatedRoute, RouterLinkActive, RouterModule } from '@angular/router'
import { NwModule } from './nw'
import { APP_MENU, AppMenuGroup } from './app-menu'
import { ComponentStore } from '@ngrx/component-store'
import { animate, animateChild, group, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { svgChevronLeft } from './ui/icons/svg'
import { IconsModule } from './ui/icons'

@Component({
  standalone: true,
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  imports: [CommonModule, NwModule, IconsModule, RouterModule],
  animations: [
    trigger('list', [
      state('true', style({
        overflow: 'hidden',
        height: '*',
      })),
      state('false', style({
        overflow: 'hidden',
        height: '36px',
      })),
      transition('* <=> *', [
        group([
          animate('0.3s ease'),
          query('@item', stagger(25, animateChild()), {
            optional: true,
          }),
        ])
      ]),
    ]),
    trigger('item', [
      state('true', style({
        display: 'block',
        opacity: 1,
        transform: 'translateX(0)'
      })),
      state('false', style({
        display: 'none',
        opacity: 0,
        transform: 'translateX(-0.5rem)'
      })),
      transition('true <=> false', [
        style({ display: 'block' }),
        animate('0.3s ease'),
      ]),
      transition('false <=> true', [
        style({ display: 'block' }),
        animate('0.3s ease'),
      ]),
    ]),
  ],
})
export class AppMenuComponent extends ComponentStore<{ menu: AppMenuGroup[], active: number }> {

  protected readonly vm$ = this.state$
  protected readonly chevronIcon = svgChevronLeft

  @ViewChildren(RouterLinkActive)
  protected links: QueryList<RouterLinkActive>

  public constructor(route: ActivatedRoute) {
    super({ menu: APP_MENU, active: 0 })

  }

  protected onGroupActive(index: number) {
    this.patchState({ active: index })
    console.log(index)
  }
}
