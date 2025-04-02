import { Component, inject, signal } from '@angular/core'
import { CreateScreenshotAsync } from '@babylonjs/core'
import { switchMap } from 'rxjs'
import { IconsModule } from '~/ui/icons'
import {
  svgBars,
  svgCamera,
  svgCircleExclamation,
  svgCubes,
  svgExpand,
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
import { selectSignal } from '~/utils'
import { ScreenshotService } from '../screenshot'
import { CharacterActionBrowserComponent } from './character-action-browser.component'
import { GameViewerService } from './game-viewer.service'

@Component({
  selector: 'nw-game-viewer-toolbar',
  templateUrl: './game-viewer-toolbar.component.html',
  host: {
    class: 'flex flex-row gap-2',
  },
  imports: [IconsModule, LayoutModule, CharacterActionBrowserComponent],
})
export class GameViewerToolbarComponent {
  protected fullscreen = inject(FullscreenService)
  protected screenshots = inject(ScreenshotService)
  protected service = inject(GameViewerService)
  protected envOptions = signal([
    { value: 'https://assets.babylonjs.com/textures/parking.env', label: 'parking' },
    { value: 'https://assets.babylonjs.com/textures/country.env', label: 'country' },
    { value: 'https://assets.babylonjs.com/textures/environment.env', label: 'environment' },
    { value: 'https://assets.babylonjs.com/textures/night.env', label: 'night' },
  ])

  protected character = this.service.character

  protected viewer = this.service.viewer
  protected viewer$ = this.service.viewer$

  protected readonly skyboxEnabled = selectSignal(this.viewer$.pipe(switchMap((it) => it.skyboxEnabled$)))
  protected readonly envMapUrl = selectSignal(this.viewer$.pipe(switchMap((it) => it.envMapUrl$)))

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
  protected iconFilms = svgFilms
  protected iconMore = svgBars
  protected iconEmpty = svgCubes

  protected toggleFullscreen() {
    this.fullscreen.toggle(this.service.host().nativeElement)
  }

  protected async capturePhoto() {
    const viewer = this.viewer()
    const size = this.fullscreen.isActive() ? window.innerWidth : 2000
    const data = await CreateScreenshotAsync(viewer.engine, viewer.camera, size)
    const blob = await fetch(data).then((res) => res.blob())
    this.screenshots.saveBlobWithDialog(blob)
  }
}
