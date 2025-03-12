import { CommonModule } from '@angular/common'
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EQUIP_SLOTS } from '@nw-data/common'
import Swiper from 'swiper'
import { GearsetStore } from '~/data'
import { IconsModule } from '~/ui/icons'
import { LayoutModule } from '~/ui/layout'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearCellSlotComponent } from '../cells/gear-cell-slot.component'
import { GearsetPaneMainComponent } from '../cells/gearset-pane-main.component'
import { GearsetPaneSkillComponent } from '../cells/gearset-pane-skill.component'
import { GearsetPaneStatsComponent } from '../cells/gearset-pane-stats.component'

@Component({
  selector: 'nwb-gearset-slider',
  templateUrl: './gearset-slider.component.html',
  styleUrl: './gearset-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    GearCellSlotComponent,
    GearsetPaneMainComponent,
    GearsetPaneSkillComponent,
    GearsetPaneStatsComponent,
    IconsModule,
    LayoutModule,
    ScreenshotModule,
  ],
  host: {
    class: 'block',
  },
})
export class GearsetSliderComponent implements AfterViewInit {
  private store = inject(GearsetStore)
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
      slidesPerView: 'auto',
      spaceBetween: 0,
      centeredSlides: true,
      grabCursor: true,
      keyboard: {
        enabled: true,
      },
    })
  }
}
