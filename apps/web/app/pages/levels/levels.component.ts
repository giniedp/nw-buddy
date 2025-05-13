import { CommonModule } from '@angular/common'
import { Component, inject, linkedSignal, resource, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { environment } from 'apps/web/environments'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgGameBoard, svgMounatinSun, svgVideo } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { GameViewerModule } from '~/widgets/game-viewer'
import { PropertyGridModule } from '../../ui/property-grid'
import { fetchTypedRequest, getLevelsUrl, LevelInfo, MapInfo } from '@nw-serve'

const DEFAULT_LEVEL = 'nw_ori_er_questliang'
const DEFAULT_POSITION: [number, number, number] = [1024, 1024, 256]

export interface LevelOptions {
  name: string
  levels: LevelOption[]
}

export interface LevelOption {
  name: string
  route: any[]
  query?: Record<string, any>
  spawns?: Array<[number, number, number, number]>
}

@Component({
  selector: 'nwb-levels-page',
  templateUrl: './levels.component.html',
  imports: [
    NwModule,
    CommonModule,
    GameViewerModule,
    RouterModule,
    FormsModule,
    LayoutModule,
    IconsModule,
    PropertyGridModule,
  ],
  host: {
    class: 'ion-page',
  },
})
export class LevelsComponent {
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  public terrainEnabled$ = this.route.queryParamMap.pipe(map((it) => it.get('terrain') !== 'false'))
  public terrainEnabled = toSignal(this.terrainEnabled$)

  public level$ = this.route.paramMap.pipe(map((it) => it.get('id') || DEFAULT_LEVEL))
  public map$ = this.route.queryParamMap.pipe(map((it) => it.get('map')))
  public level = toSignal(this.level$)
  public map = toSignal(this.map$)
  public levels = resource({
    loader: async (): Promise<LevelOptions[]> => {
      const levels = await fetchTypedRequest(environment.nwbtUrl, getLevelsUrl())
      const withoutMaps: LevelOption[] = []
      const withOneMap: LevelOption[] = []
      const mapGroups: LevelOptions[] = []
      for (const level of levels) {
        if (!level.maps?.length) {
          withoutMaps.push({
            name: level.name,
            route: ['/levels', level.name],
          })
          continue
        }
        if (level.maps.length === 1) {
          withOneMap.push(getMapOption(level, level.maps[0]))
          continue
        }
        mapGroups.push({
          name: level.name,
          levels: [
            {
              name: level.name,
              route: ['/levels', level.name],
            },
            ...level.maps.map((map) => {
              return getMapOption(level, map)
            }),
          ].sort((a, b) => a.name.localeCompare(b.name)),
        })
      }
      return [
        ...mapGroups,
        {
          name: 'Maps',
          levels: withOneMap.sort((a, b) => a.name.localeCompare(b.name)),
        },
        {
          name: 'Other',
          levels: withoutMaps.sort((a, b) => a.name.localeCompare(b.name)),
        },
      ]
    },
  })

  public cameraPosition = linkedSignal(() => getCameraPosition(this.route))

  protected iconLevel = svgGameBoard
  protected iconCamera = svgVideo
  protected iconTerrain = svgMounatinSun

  public handleCameraPositionChange(position: [number, number, number]) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        position: position.map((it) => Math.round(it)).join(',')
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }

  public handleTerrainChange(value: boolean) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { terrain: String(value) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }

  public handleLevelChange(e: Event, level: LevelOption) {
    if (level.spawns?.length) {
      const spawn = level.spawns[0]
      this.cameraPosition.set([spawn[0], spawn[1], spawn[2] + 1.8])
    }
  }
}

function getCameraPosition(route: ActivatedRoute): [number, number, number] {
  const valueStr = route.snapshot.queryParamMap.get('position') || ''
  const tokens = valueStr.split(',').map(Number)
  if (tokens.length === 3 && tokens.every((it) => !isNaN(it) && isFinite(it))) {
    return tokens as [number, number, number]
  }
  return DEFAULT_POSITION
}

function getMapOption(level: LevelInfo, map: MapInfo): LevelOption {
  const spawns = getSpawnPositions(map)
  const route: any[] = ['/levels', level.name]
  const query = { map: map.gameModeMapId.toLowerCase() }
  if (spawns.length > 0) {
    query['position'] = spawns[0].join(',')
  }

  return {
    name: map.gameModeMapId,
    route: route,
    query: query,
    spawns: spawns,
  }
}

function getSpawnPositions(map: MapInfo): Array<[number, number, number, number]> {
  if (!map.teamTeleportData) {
    return null
  }
  return map.teamTeleportData.split('+').map((area) => {
    return area.split(',').map((it) => Math.round(Number(it))) as [number, number, number, number]
  })
}
