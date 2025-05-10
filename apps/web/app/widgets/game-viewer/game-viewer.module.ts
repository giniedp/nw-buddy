import { NgModule } from '@angular/core'
import { GameViewerCameraComponent } from './game-viewer-camera.component'
import { GameViewerCharacterDirective } from './game-viewer-character.directive'
import { GameViewerLevelDirective } from './game-viewer-level.directive'
import { GameViewerModelComponent } from './game-viewer-model.component'
import { GameViewerStatsComponent } from './game-viewer-stats.component'
import { GameViewerComponent } from './game-viewer.component'

const COMPONENTS = [
  GameViewerComponent,
  GameViewerCharacterDirective,
  GameViewerLevelDirective,
  GameViewerStatsComponent,
  GameViewerModelComponent,
  GameViewerCameraComponent,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class GameViewerModule {}
