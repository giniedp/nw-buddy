import { GridOptions } from '@ag-grid-community/core'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { GameModeData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { DataGridModule, TableGridUtils } from '~/ui/data/table-grid'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { eqCaseInsensitive, injectRouteParam, resourceValue } from '~/utils'
import { VitalGridCellComponent, vitalColIcon, vitalColLevel, vitalColName } from '~/widgets/data/vital-table'
import { ZoneDetailModule } from '~/widgets/data/zone-detail'
import { LootModule } from '~/widgets/loot'
import { ScreenshotModule } from '~/widgets/screenshot'
import { injectNwData } from '../../../data'
import { ItemFrameModule } from '../../../ui/item-frame'

@Component({
  selector: 'nwb-zones-detail-page',
  template: `
    @if (zoneIdParam()) {
      <nwb-zone-detail class="flex-none bg-black/75" [zoneId]="zoneIdParam()" #detail />
    }

    @for (map of gameModeMaps(); track $index) {
      <nwb-item-header class="gap-2 flex-none rounded-md overflow-clip">
        <a [nwbItemIcon]="map.icon" class="w-12 h-12"> </a>
        <nwb-item-header-content
          class="z-10"
          [title]="map.title | nwText | nwTextBreak: ' - '"
          [text2]="map.subtitle | nwText"
          [text1]="map.category | nwText"
          [titleLink]="map.link"
        />
      </nwb-item-header>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    ScreenshotModule,
    LootModule,
    IconsModule,
    TooltipModule,
    ZoneDetailModule,
    LayoutModule,
    DataGridModule,
    ItemFrameModule,
  ],
  providers: [],
  host: {
    class: 'flex flex-col gap-2',
  },
})
export class ZoneDetailPageComponent {
  private db = injectNwData()
  protected idParam = toSignal(injectRouteParam('id'))
  protected zoneIdParam = computed(() => {
    const id = this.idParam()
    return isZoneId(id) ? id : null
  })
  protected mapIdParam = computed(() => {
    const id = this.idParam()
    return isZoneId(id) ? null : id
  })

  protected iconLink = svgSquareArrowUpRight
  protected gridUtils = inject(TableGridUtils)
  protected gridOptions: GridOptions = {
    columnDefs: [
      vitalColIcon(this.gridUtils, { color: true }),
      vitalColName(this.gridUtils, { link: true }),
      vitalColLevel(this.gridUtils),
    ],
  }

  protected virtualGridOptions = VitalGridCellComponent.buildGridOptions()

  protected gameModeMaps = resourceValue({
    keepPrevious: true,
    params: () => {
      return {
        mapId: this.mapIdParam(),
      }
    },
    loader: async ({ params: { mapId } }) => {
      if (!mapId) {
        return []
      }
      const maps = await this.db.gameModesMapsAll()
      const modes = await this.db.gameModesByIdMap()
      return maps
        .filter((it) => {
          return it.CoatlicueName?.toLocaleLowerCase()?.endsWith(mapId)
        })
        .map((map) => {
          const mode = modes.get(map.GameModeId)
          const category = gameModeCategory(mode)
          const title = map.UIMapDisplayName || mode?.DisplayName
          return {
            icon: mode?.IconPath || NW_FALLBACK_ICON,
            title,
            subtitle: map.UIMapDisplayName ? mode?.DisplayName : null,
            category,
            link: ['/game-modes', category, map.GameModeMapId.toLowerCase()],
          }
        })
    },
  })
}

function isZoneId(id: string) {
  return id && id.match(/^\d+$/)
}
function gameModeCategory(mode?: GameModeData): string {
  if (!mode) {
    return null
  }
  if (eqCaseInsensitive(mode.GameModeId, 'mutation') || eqCaseInsensitive(mode.GameModeId, 'dungeon')) {
    // useless dummies
    return null
  }
  if (mode.IsSoloTrial) {
    return 'soul-trials'
  }
  if (mode.IsSeasonTrial) {
    return 'season-trials'
  }
  if (mode.IsRaidTrial) {
    return 'raids'
  }
  if (mode.IsDungeon) {
    return 'expeditions'
  }
  if (mode.ActivityType) {
    return 'activities'
  }
  return null
}
