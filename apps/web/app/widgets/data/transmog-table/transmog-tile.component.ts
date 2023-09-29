import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { NwModule } from '~/nw'
import {
  TransmogItem,
  getAppearanceDyeChannels,
  isTransmogFromShop,
  isTransmogSkin,
  isTransmogUnique,
} from '../transmog'

@Component({
  standalone: true,
  selector: 'nwb-transmog-tile,a[nwbTransmogTile]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <picture class="block w-full aspect-square relative">
      <img class="w-full h-full object-cover" [nwImage]="icon" />
      <div class="absolute bottom-1 right-1 left-1 flex flex-row justify-end gap-1">
        <span class="badge badge-primary badge-sm" *ngIf="isSkin">Skin</span>
        <span
          class="badge badge-sm"
          [class.badge-secondary]="itemCount > 0"
          [class.badge-error]="!itemCount"
          *ngIf="!isUnique"
        >
          {{ itemCount }}
        </span>
      </div>
    </picture>
    <div class="absolute left-0 bottom-0 right-0 flex flex-row" *ngIf="colorPalette; let colors">
      <div
        *ngFor="let item of colors"
        [style.background-color]="item.color"
        [style.opacity]="item.opacity"
        class="flex-1 h-1"
      ></div>
    </div>
  `,
  imports: [CommonModule, NwModule],
  host: {
    class: 'd-block relative overflow-hidden',
  },
})
export class TransmogTileComponent {
  @Input()
  public set nwbTransmogTile(value: TransmogItem) {
    this.item = value
  }

  @Input()
  public set item(value: TransmogItem) {
    this.icon = value.appearance?.IconPath ?? ''
    this.isSkin = isTransmogSkin(value) || isTransmogFromShop(value)
    this.isUnique = isTransmogUnique(value)
    this.itemCount = value.items.length
    this.colorPalette = []

    const dyeChannels = getAppearanceDyeChannels(value.appearance)
    if (dyeChannels.some((it) => it.colorStrength)) {
      this.colorPalette = dyeChannels.map((it) => {
        return {
          color: it.color,
          opacity: it.colorStrength,
        }
      })
    }
  }
  protected icon: string
  protected isSkin: boolean
  protected isUnique: boolean
  protected itemCount: number
  protected colorPalette: Array<{ color: string; opacity: number }>

  public constructor() {
    //
  }
}
