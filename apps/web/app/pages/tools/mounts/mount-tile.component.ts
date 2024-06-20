import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { MountData } from '@nw-data/generated'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-mount-tile,a[nwbMountTile]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <picture class="block w-full aspect-video relative">
      <img class="w-full h-full object-cover" [nwImage]="icon" />
      <h3 class="absolute bottom left-0 right-0 bottom-0 bg-black bg-opacity-50 px-3 py-2 text-lg font-bold">
        {{ title | nwText }}
      </h3>
    </picture>
  `,
  imports: [CommonModule, NwModule],
  host: {
    class: 'd-block relative overflow-hidden',
  },
})
export class MountTileComponent {
  @Input()
  public set nwbMountTile(value: MountData) {
    this.item = value
  }

  @Input()
  public set item(value: MountData) {
    this.icon = value?.HiResIconPath || NW_FALLBACK_ICON
    this.title = value?.DisplayName
  }

  protected icon: string
  protected title: string

  public constructor() {
    //
  }
}
