import { Component, HostBinding, inject } from '@angular/core'
import { TerritoryDefinition } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { PropertyGridModule, gridDescriptor } from '~/ui/property-grid'
import { iconCell, linkCell, tagsCell, valueCell } from '~/ui/property-grid/cells'
import { diffButtonCell } from '~/widgets/diff-tool'
import { ZoneDetailStore } from './zone-detail.store'

@Component({
  selector: 'nwb-zone-detail-content',
  template: `
    @if (store.image(); as img) {
      <img [nwImage]="img" class="absolute top-0 right-0 left-0 aspect-video object-cover w-full select-none" />
    }
    @if (store.description(); as text) {
      <div
        [nwHtml]="text | nwText | nwTextBreak"
        class="z-0 shadow-black text-shadow-sm text-nw-description italic font-nimbus"
      ></div>
    }
    @if (store.properties(); as props) {
      <nwb-property-grid
        class="gap-x-2 font-mono w-full overflow-auto text-sm leading-tight z-0"
        [item]="props"
        [descriptor]="descriptor"
      />
    }
  `,
  imports: [NwModule, PropertyGridModule],
  host: {
    class: 'flex-1 flex flex-col gap-2 empty:hidden relative',
  },
  styles: [
    `
      img {
        mask-image: linear-gradient(to right, transparent 25%, black 100%);
      }
    `,
  ],
})
export class ZoneDetailContentComponent {
  protected store = inject(ZoneDetailStore)

  @HostBinding('class.min-h-[200px]')
  protected get hasImage() {
    return !!this.store.image()
  }
  public descriptor = gridDescriptor<TerritoryDefinition>(
    {
      TerritoryID: (value) => [
        linkCell({ value: String(value), routerLink: ['poi', String(value || '')] }),
        diffButtonCell({ record: this.store.record(), idKey: 'TerritoryID' }),
      ],
      LootTags: (value) => tagsCell({ value }),
      POITag: (value) => tagsCell({ value }),
      CompassIcon: (value) => iconCell({ value, size: 'w-6 h-6' }),
      UnchartedIcon: (value) => iconCell({ value, size: 'w-6 h-6' }),
    },
    (value) => valueCell({ value }),
  )
}
