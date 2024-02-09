import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { EQUIP_SLOTS, EquipSlot } from '@nw-data/common'
import { GearsetSignalStore } from '~/data'
import { IconsModule } from '~/ui/icons'
import { LayoutModule } from '~/ui/layout'
import { SwiperDirective } from '~/utils/directives/swiper.directive'
import { ScreenshotFrameDirective, ScreenshotModule } from '~/widgets/screenshot'
import { DamageCalculatorComponent } from '../calculator/damage-calculator.component'
import { GearCellSlotComponent } from '../cells/gear-cell-slot.component'
import { GearsetPaneMainComponent } from '../cells/gearset-pane-main.component'
import { GearsetPaneSkillComponent } from '../cells/gearset-pane-skill.component'
import { GearsetPaneStatsComponent } from '../cells/gearset-pane-stats.component'
import { GearsetLoadoutItemComponent } from '../loadout'
import { GearsetPaneComponent } from './gearset-pane.component'
import { GearsetToolbarComponent } from './gearset-toolbar.component'

@Component({
  standalone: true,
  selector: 'nwb-gearset-grid',
  templateUrl: './gearset-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    CommonModule,
    DamageCalculatorComponent,
    FormsModule,
    GearCellSlotComponent,
    GearsetLoadoutItemComponent,
    GearsetPaneMainComponent,
    GearsetPaneSkillComponent,
    GearsetPaneStatsComponent,
    GearsetToolbarComponent,
    IonSegment,
    IonSegmentButton,
    IconsModule,
    LayoutModule,
    ScreenshotModule,
    SwiperDirective,
    GearsetPaneComponent,
  ],
  host: {
    class: 'block @container',
  },
  hostDirectives: [
    {
      directive: ScreenshotFrameDirective,
    },
  ],
  animations: [
    trigger('list', [
      transition('* => *', [
        query(':enter', stagger(25, animateChild()), {
          optional: true,
        }),
      ]),
    ]),
    trigger('fade', [transition('* => *', [style({ opacity: 0 }), animate('0.3s ease-out', style({ opacity: 1 }))])]),
  ],
})
export class GearsetGridComponent {
  private store = inject(GearsetSignalStore)

  protected get gearset() {
    return this.store.gearset()
  }
  protected slotGroups = computed(() => {
    const slots = EQUIP_SLOTS.filter(
      (it) => it.itemType !== 'Consumable' && it.itemType !== 'Ammo' && it.itemType !== 'Trophies',
    )
    const result: EquipSlot[][] = []
    while (slots.length) {
      result.push(slots.splice(0, 2))
    }
    return result
  })

  constructor(screenshot: ScreenshotFrameDirective) {
    effect(() => {
      screenshot.nwbScreenshotFrame = this.gearset?.name
      screenshot.nwbScreenshotWidth = 1660
      screenshot.nwbScreenshotMode = 'detached'
    })
  }
}
