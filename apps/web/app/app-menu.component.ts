import { animate, animateChild, group, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ComponentStore } from '@ngrx/component-store'
import { takeUntil } from 'rxjs'
import { APP_MENU, AppMenuGroup } from './app-menu'
import { NwModule } from './nw'
import { AppPreferencesService } from './preferences'
import { IconsModule } from './ui/icons'
import { svgChevronLeft } from './ui/icons/svg'
import { MenuCloseDirective } from './ui/layout/menu.directive'

@Component({
  standalone: true,
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  imports: [CommonModule, NwModule, IconsModule, RouterModule, MenuCloseDirective],
  animations: [
    trigger('list', [
      state(
        'true',
        style({
          overflow: 'hidden',
          height: '*',
        })
      ),
      state(
        'false',
        style({
          overflow: 'hidden',
          height: '36px',
        })
      ),
      transition('* <=> *', [
        group([
          animate('0.3s ease'),
          query('@item', stagger(25, animateChild()), {
            optional: true,
          }),
        ]),
      ]),
    ]),
    trigger('item', [
      state(
        'true',
        style({
          display: 'block',
          opacity: 1,
          transform: 'translateX(0)',
        })
      ),
      state(
        'false',
        style({
          display: 'none',
          opacity: 0,
          transform: 'translateX(-0.5rem)',
        })
      ),
      transition('true <=> false', [style({ display: 'block' }), animate('0.3s ease')]),
      transition('false <=> true', [style({ display: 'block' }), animate('0.3s ease')]),
    ]),
  ],
})
export class AppMenuComponent
  extends ComponentStore<{ menu: AppMenuGroup[]; active: Record<string, boolean> }>
  implements OnInit
{
  private readonly menu$ = this.select(({ menu }) => menu)
  private readonly active$ = this.select(({ active }) => active)
  protected readonly vm$ = this.select(this.menu$, this.active$, (menu, active) => {
    return {
      menu: menu.map((group) => {
        return {
          ...group,
          active: !!(!group.label || active[group.category] || false),
        }
      }),
    }
  })

  protected readonly chevronIcon = svgChevronLeft
  protected trackByIndex = (i: number) => i
  public constructor(private preferences: AppPreferencesService) {
    super({
      menu: APP_MENU,
      active: null,
    })
  }

  public ngOnInit() {
    const pref = this.preferences.appMenu
    this.patchState({
      active: pref.get() || { [APP_MENU[0].category]: true },
    })
    this.active$.pipe(takeUntil(this.destroy$)).subscribe((active) => {
      pref.set(active)
    })
  }

  protected async onGroupActive(category: string) {
    this.updateGroup(category, true)
  }

  protected async updateGroup(category: string, isActive: boolean) {
    this.patchState({
      active: this.get(({ active }) => {
        return {
          ...(active || {}),
          [category]: isActive,
        }
      }),
    })
  }
}
