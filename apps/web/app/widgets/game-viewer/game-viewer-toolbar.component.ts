import { Component, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { of, switchMap } from 'rxjs'
import { IconsModule } from '~/ui/icons'
import {
  svgBars,
  svgCamera,
  svgCameraViewfinder,
  svgCircleExclamation,
  svgCubes,
  svgExpand,
  svgFilm,
  svgGlobeSnow,
  svgMoon,
  svgPause,
  svgPlay,
  svgStop,
  svgSun,
  svgXmark,
} from '~/ui/icons/svg'
import { FullscreenService, LayoutModule } from '~/ui/layout'
import { ScreenshotService } from '../screenshot'
import { GameViewerService } from './game-viewer.service'

@Component({
  selector: 'nwb-game-viewer-toolbar',
  templateUrl: './game-viewer-toolbar.component.html',
  host: {
    class: 'flex flex-row items-center justify-end gap-2',
  },
  imports: [IconsModule, LayoutModule],
})
export class GameViewerToolbarComponent {
  protected fullscreen = inject(FullscreenService)
  protected screenshots = inject(ScreenshotService)
  protected service = inject(GameViewerService)
  protected loadedEntity = this.service.loadedEntity
  private bridge$ = this.service.bridge$

  protected bridge = this.service.bridge
  protected envMapConnected = toSignal(this.bridge$.pipe(switchMap((it) => it.envMapConnected || of(false))))
  protected envMapBackground = toSignal(this.bridge$.pipe(switchMap((it) => it.envMappedBackground || of(false))))
  protected envMapUrl = toSignal(this.bridge$.pipe(switchMap((it) => it.envMapUrl || of(null))))

  protected terrainConnected = toSignal(this.bridge$.pipe(switchMap((it) => it.terrainConnected || of(false))))
  protected terrainEnabled = toSignal(this.bridge$.pipe(switchMap((it) => it.terrainEnabled || of(false))))

  protected envOptions = signal([
    { value: 'https://assets.babylonjs.com/textures/parking.hdr', label: 'parking' },
    { value: 'https://assets.babylonjs.com/textures/country.hdr', label: 'country' },
    { value: 'https://assets.babylonjs.com/textures/environment.hdr', label: 'environment' },
    { value: 'https://assets.babylonjs.com/textures/night.hdr', label: 'night' },
  ])

  protected iconClose = svgXmark
  protected iconFullscreen = svgExpand
  protected iconCamera = svgCamera
  protected iconError = svgCircleExclamation
  protected iconSun = svgSun
  protected iconMoon = svgMoon
  protected iconPlay = svgPlay
  protected iconPause = svgPause
  protected iconStop = svgStop
  protected iconEnv = svgGlobeSnow
  protected iconFilms = svgFilm
  protected iconMore = svgBars
  protected iconCubes = svgCubes
  protected iconReframe = svgCameraViewfinder

  protected toggleFullscreen() {
    this.fullscreen.toggle(this.service.host())
  }

  // protected async capturePhoto() {
  //   const game = this.service.game()
  //   const scene = game.get(SceneProvider).main
  //   const engine = scene.getEngine()
  //   const size = this.fullscreen.isActive() ? window.innerWidth : 2000
  //   const data = await CreateScreenshotAsync(engine, scene.activeCamera, size)
  //   const blob = await fetch(data).then((res) => res.blob())
  //   this.screenshots.saveBlobWithDialog(blob)
  // }

  protected toggleDebugView() {
    this.bridge().toggleDebug()
  }

  protected reframeCamera() {
    const entity = this.loadedEntity()
    this.bridge().reframeCameraOn(entity)
  }
}
