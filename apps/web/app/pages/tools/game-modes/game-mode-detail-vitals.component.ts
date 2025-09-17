import { Component, inject, input, output } from '@angular/core'
import { VitalsBaseData } from '@nw-data/generated'
import { IconsModule } from '../../../ui/icons'
import { svgLocationCrosshairs, svgThumbtack } from '../../../ui/icons/svg'
import { InfiniteScrollDirective, PaginationModule } from '../../../ui/pagination'
import { VitalDetailModule } from '../../../widgets/data/vital-detail'
import { GameModeStore } from './game-mode.store'

@Component({
  selector: 'nwb-game-mode-detail-vitals',
  template: `
    @for (item of items(); track item.VitalsID; let index = $index) {
      <nwb-vital-detail-card
        [vitalId]="item.VitalsID"
        [level]="store.creatureLevelOverride()"
        [mutaElement]="store.mutaElementId()"
        [mutaDifficulty]="store.mutaDifficultyLevel()"
        [activeTab]="activeTab()"
        (activeTabChange)="activeTabChange.emit($event)"
        animate.enter="fade-slide-up-enter"
        [style.--enter-delay.ms]="250 + index * 50"
      >
        <button
          class="absolute top-1 right-1 btn btn-sm btn-square btn-ghost"
          header
          [class.text-primary]="item === selectedVital()"
          (mouseenter)="vitalTargetEnter.emit(item)"
          (mouseleave)="vitalTargetLeave.emit(item)"
          (click)="vitalTargetClick.emit(item)"
        >
          <nwb-icon [icon]="iconTarget" class="w-5 h-5" />
        </button>
      </nwb-vital-detail-card>
    }
  `,
  imports: [PaginationModule, VitalDetailModule, IconsModule],
  hostDirectives: [
    {
      directive: InfiniteScrollDirective,
      inputs: ['nwbInfniteScroll: items'],
    },
  ],
  host: {
    class: 'grid gap-4',
  },
  styles: `
    :host {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }
  `,
})
export class GameModeDetailVitalsComponent {
  protected store = inject(GameModeStore)
  protected scroll = inject(InfiniteScrollDirective)
  public items = input<Array<VitalsBaseData>>([])
  protected iconTarget = svgLocationCrosshairs
  protected iconPin = svgThumbtack

  public activeTab = input<string>()
  public activeTabChange = output<string>()
  public selectedVital = input<VitalsBaseData>()
  public vitalTargetEnter = output<VitalsBaseData>()
  public vitalTargetLeave = output<VitalsBaseData>()
  public vitalTargetClick = output<VitalsBaseData>()
}
