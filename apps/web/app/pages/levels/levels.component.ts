import { CommonModule } from '@angular/common'
import { Component, inject, resource, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { Vector3 } from '@babylonjs/core'
import { environment } from 'apps/web/environments'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgGameBoard, svgMounatinSun, svgVideo } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { tapDebug } from '~/utils'
import { GameViewerModule } from '~/widgets/game-viewer'

const DEFAULT_MAP = 'nw_opr_004_trench'
const DEFAULT_POSITION: [number, number, number] = [1024, 256, 1024]
@Component({
  selector: 'nwb-levels-page',
  templateUrl: './levels.component.html',
  imports: [NwModule, CommonModule, GameViewerModule, RouterModule, FormsModule, LayoutModule, IconsModule],
  host: {
    class: 'ion-page',
  },
})
export class LevelsComponent {
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  public terrainEnabled$ = this.route.queryParamMap.pipe(map((it) => it.get('terrain') !== 'false'))
  public terrainEnabled = toSignal(this.terrainEnabled$)

  public level$ = this.route.paramMap.pipe(map((it) => it.get('id') || DEFAULT_MAP))
  public level = toSignal(this.level$)
  public levels = resource({
    loader: async (): Promise<string[]> => {
      return fetch(`${environment.nwbtUrl}/level`).then((it) => it.json())
    },
  })
  public cameraPosition = signal(getCameraPosition(this.route))

  protected iconLevel = svgGameBoard
  protected iconCamera = svgVideo
  protected iconTerrain = svgMounatinSun

  public handleCameraPositionChange(position: Vector3) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { position: [Math.round(position.x), Math.round(position.y), Math.round(position.z)].join(',') },
      queryParamsHandling: 'merge',
    })
  }

  public handleTerrainChange(value: boolean) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { terrain: String(value) },
      queryParamsHandling: 'merge',
    })
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
