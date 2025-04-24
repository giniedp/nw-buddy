import { NgModule } from '@angular/core'
import { GameViewerCameraDirective } from './game-viewer-camera.directive'
import { GameViewerCharacterDirective } from './game-viewer-character.directive'
import { GameViewerLevelDirective } from './game-viewer-level.directive'
import { GameViewerComponent } from './game-viewer.component'

const COMPONENTS = [
  GameViewerComponent,
  GameViewerCharacterDirective,
  GameViewerLevelDirective,
  GameViewerCameraDirective,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class GameViewerModule {}
