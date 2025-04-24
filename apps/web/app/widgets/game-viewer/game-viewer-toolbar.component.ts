import { Component, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { CreateScreenshotAsync } from '@babylonjs/core'
import { Inspector } from '@babylonjs/inspector'
import { AdbFragment } from '@nw-viewer/adb'
import { LightingProvider } from '@nw-viewer/services/lighting-provider'
import { SceneProvider } from '@nw-viewer/services/scene-provider'
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
  svgFilms,
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
import { CharacterActionBrowserComponent } from './character-action-browser.component'
import { GameViewerService } from './game-viewer.service'
import { GameViewerCharacterDirective } from './game-viewer-character.directive'

@Component({
  selector: 'nwb-game-viewer-toolbar',
  templateUrl: './game-viewer-toolbar.component.html',
  host: {
    class: 'flex flex-row items-center justify-end gap-2',
  },
  imports: [IconsModule, LayoutModule],
})
export class GameViewerToolbarComponent {
  private charViewer = inject(GameViewerCharacterDirective, { optional: true })

  protected fullscreen = inject(FullscreenService)
  protected screenshots = inject(ScreenshotService)
  protected service = inject(GameViewerService)
  protected envOptions = signal([
    { value: 'https://assets.babylonjs.com/textures/parking.env', label: 'parking' },
    { value: 'https://assets.babylonjs.com/textures/country.env', label: 'country' },
    { value: 'https://assets.babylonjs.com/textures/environment.env', label: 'environment' },
    { value: 'https://assets.babylonjs.com/textures/night.env', label: 'night' },
  ])

  protected lighting$ = this.service.service(LightingProvider)
  protected envMapUrl$ = this.lighting$.pipe(switchMap((it) => it.envUrl$ || of(null)))
  protected skyboxEnabled$ = this.lighting$.pipe(switchMap((it) => it.skybox$ || of(false)))

  protected lighting = toSignal(this.lighting$)
  protected envMapUrl = toSignal(this.envMapUrl$)
  protected skyboxEnabled = toSignal(this.skyboxEnabled$)
  protected adbActions = this.service.adbActions
  protected adbTags = this.service.adbTags
  protected canReframe = !!this.charViewer

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
    this.fullscreen.toggle(this.service.host().nativeElement)
  }

  protected async capturePhoto() {
    const game = this.service.game()
    const scene = game.get(SceneProvider).main
    const engine = scene.getEngine()
    const size = this.fullscreen.isActive() ? window.innerWidth : 2000
    const data = await CreateScreenshotAsync(engine, scene.activeCamera, size)
    const blob = await fetch(data).then((res) => res.blob())
    this.screenshots.saveBlobWithDialog(blob)
  }

  protected toggleDebugView() {
    if (Inspector.IsVisible) {
      Inspector.Hide()
      return
    }
    const scene = this.service.game().get(SceneProvider).main
    Inspector.Show(scene, {
      globalRoot: this.service.host().nativeElement.querySelector('#inspector'),
      embedMode: true,
    })
  }

  protected reframeCamera() {
    this.charViewer.reframeCamera()
  }
}
