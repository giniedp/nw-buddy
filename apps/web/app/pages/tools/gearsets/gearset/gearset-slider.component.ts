import { CommonModule } from '@angular/common'
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { EQUIP_SLOTS, EquipSlot } from '@nw-data/common'
import { GearsetSignalStore } from '~/data'
import { IconsModule } from '~/ui/icons'
import { LayoutModule } from '~/ui/layout'
import { SwiperDirective } from '~/utils/directives/swiper.directive'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearCellSlotComponent } from '../cells/gear-cell-slot.component'
import { GearsetPaneMainComponent } from '../cells/gearset-pane-main.component'
import { GearsetPaneSkillComponent } from '../cells/gearset-pane-skill.component'
import { GearsetPaneStatsComponent } from '../cells/gearset-pane-stats.component'
import { GearsetLoadoutItemComponent } from '../loadout'
import { GearsetPaneComponent } from './gearset-pane.component'
import { GearsetToolbarComponent } from './gearset-toolbar.component'
import Swiper from 'swiper'
import { EmbedHeightDirective } from '~/utils/directives/embed-height.directive'

@Component({
  standalone: true,
  selector: 'nwb-gearset-slider',
  templateUrl: './gearset-slider.component.html',
  styleUrl: './gearset-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
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
    class: 'block',
  },
  hostDirectives: [EmbedHeightDirective]
})
export class GearsetSliderComponent implements AfterViewInit {
  private store = inject(GearsetSignalStore)
  private swiper: Swiper
  @ViewChild('swiperRef', { static: true })
  protected swiperRef: ElementRef<HTMLElement>
  protected get gearset() {
    return this.store.gearset()
  }
  protected slots = computed(() => {
    return EQUIP_SLOTS.filter(
      (it) => it.itemType !== 'Consumable' && it.itemType !== 'Ammo' && it.itemType !== 'Trophies',
    )
  })

  public ngAfterViewInit() {
    this.swiper = new Swiper(this.swiperRef.nativeElement, {
      slidesPerView: "auto",
      spaceBetween: 0,
      centeredSlides: true,
      grabCursor: true,
      keyboard: {
        enabled: true,
      },
    });
  }
}
