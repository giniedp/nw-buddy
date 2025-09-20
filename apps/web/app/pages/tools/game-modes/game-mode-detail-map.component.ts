import { Component, computed, inject, input } from '@angular/core'
import { getGameModeCoatlicueDirectory } from '@nw-data/common'
import { GameModeMapData, ScannedVital, VitalsBaseData } from '@nw-data/generated'
import { Feature, FeatureCollection, MultiPoint } from 'geojson'
import { uniq } from 'lodash'
import { injectNwData } from '~/data'
import { CaseInsensitiveMap, eqCaseInsensitive, resourceValue, stringToColor } from '~/utils'
import { GameMapComponent, GameMapLayerDirective, GameMapService } from '~/widgets/game-map'

@Component({
  selector: 'nwb-game-mode-detail-map',
  template: `
    @if (mapId()) {
      <nwb-map
        class="w-full h-full rounded-md transition-all bg-opacity-0 hover:bg-opacity-10"
        [mapId]="uiMapId()"
        [fitBounds]="bounds()"
        [fitBoundsOptions]="{ animate: false }"
      >
        @if (vitals(); as data) {
          <ng-container
            #mapLayer="mapLayer"
            [nwbMapLayer]="'vitals'"
            [disabled]="false"
            [data]="data"
            [filter]="filter()"
          />
        }
      </nwb-map>
    }
    <ng-content />
  `,
  imports: [GameMapComponent, GameMapLayerDirective],
  host: {
    class: 'block relative rounded-md overflow-clip',
  },
})
export class GameModeDetailMapComponent {
  private db = injectNwData()
  private service = inject(GameMapService)

  public mapId = input.required<string>()
  public creatures = input<VitalsBaseData[]>([])
  public highlight = input<string>()

  private resources = resourceValue({
    keepPrevious: true,
    params: () => {
      return {
        mapId: this.mapId(),
        vitals: this.creatures(),
      }
    },
    loader: async ({ params: { mapId, vitals } }) => {
      const gameModeMap = await this.db.gameModesMapsById(mapId)
      const vitalsMetaMap = await this.db.vitalsMetadataByIdMap()
      const coatlicueName = getGameModeCoatlicueDirectory(gameModeMap)?.toLowerCase()
      return {
        uiMapId: coatlicueName,
        bounds: selectWorldBounds(mapId, gameModeMap, this.service),
        vitals: selectVitalsData({
          mapId: coatlicueName,
          vitals,
          vitalsMetaMap,
          mapCoord: this.service.xyToLngLat,
        }),
      }
    },
  })

  protected uiMapId = computed(() => this.resources()?.uiMapId)
  protected bounds = computed(() => this.resources()?.bounds)
  protected vitals = computed(() => this.resources()?.vitals)
  protected filter = computed(() => {
    const highlight = this.highlight()?.toLowerCase()
    if (!highlight) {
      return null
    }
    return ['==', ['get', 'id'], highlight] as any
  })
}

function selectWorldBounds(mapId: string, map: GameModeMapData, service: GameMapService): [number, number, number, number] {
  if (!map?.WorldBounds) {
    return null
  }

  if (BOUNDS.has(mapId)) {
    const [x1, y1, x2, y2] = BOUNDS.get(mapId)
    return [service.xToLng(x1), service.yToLat(y1), service.xToLng(x2), service.yToLat(y2)]
  }

  const [x, y, w, h] = (map.WorldBounds?.split(',') || []).map(Number)
  return [service.xToLng(x), service.yToLat(y), service.xToLng(x + w), service.yToLat(y + h)]
}

const BOUNDS = new CaseInsensitiveMap(
  Object.entries({
    DungeonAmrine: [600, 550, 1000, 1000],
    DungeonShatteredObelisk: [300, 270, 1000, 730],
    DungeonRestlessShores01: [690, 800, 1300, 1400],
    DungeonEbonscale00: [4500, 4100, 5100, 4600],
    DungeonEdengrove00: [350, 1000, 900, 1600],
    DungeonReekwater00: [650, 550, 1000, 1000],
    DungeonCutlassKeys00: [270, 760, 700, 1200],
    DungeonGreatCleave01: [500, 200, 920, 670],
    DungeonShatterMtn00: [360, 450, 1600, 1300],
    DungeonBrimstoneSands00: [700, 820, 1370, 1500],
    DungeonFirstLight01: [490, 650, 960, 1200],
    DungeonGreatCleave00: [830, 440, 1260, 960],
    RaidCutlassKeys00: [540, 600, 1340, 1340],
    arena3v3: [864, 832, 992, 960],
  }),
)

export type MapCoord = (coord: number[] | [number, number]) => number[]

export type VitalsFeatureCollection = FeatureCollection<MultiPoint, VitalsFeatureProperties>
export type VitalsFeature = Feature<MultiPoint, VitalsFeatureProperties>
export interface VitalsFeatureProperties {
  id: string
  level: number
  type: string
  categories: string[]
  color: string
  size: number
}
function selectVitalsData(options: {
  mapId: string
  vitals: VitalsBaseData[]
  vitalsMetaMap: Map<string, ScannedVital>
  mapCoord: MapCoord
}): VitalsFeatureCollection {
  let featureId = 0

  const features: Record<string, Feature<MultiPoint, VitalsFeatureProperties>> = {}
  for (const item of options.vitals) {
    const meta = options.vitalsMetaMap.get(item.VitalsID)
    const lvlSpawns = meta?.spawns
    if (!lvlSpawns) {
      continue
    }
    const id = item.VitalsID.toLowerCase()
    const color = stringToColor(item.VitalsID)
    const type = (item.CreatureType || '').toLowerCase()
    for (const mapId in lvlSpawns) {
      if (!eqCaseInsensitive(options.mapId, mapId)) {
        continue
      }
      const spawns = lvlSpawns[mapId]
      for (const spawn of spawns) {
        const levels = spawn.l
        const position = spawn.p
        const categories = uniq(
          [...(item.VitalsCategories || []), ...(spawn.c || [])].map((it) => (it || '').toLowerCase()),
        )
        for (const level of levels) {
          const key = [id, level, categories.join()].join()
          if (!features[key]) {
            features[key] = {
              id: featureId++,
              type: 'Feature',
              geometry: {
                type: 'MultiPoint',
                coordinates: [],
              },
              properties: {
                id,
                level,
                color,
                categories,
                type,
                size: 0.65,
              },
            }
          }

          features[key].geometry.coordinates.push(options.mapCoord(position))
        }
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: Object.values(features),
  }
}
