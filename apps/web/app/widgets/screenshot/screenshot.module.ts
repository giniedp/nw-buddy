import { NgModule } from '@angular/core'
import { ScreenshotButtonComponent } from './screenshot-button.component'
import { ScreenshotFrameDirective } from './screenshot-frame.directive'

@NgModule({
  imports: [ScreenshotFrameDirective, ScreenshotButtonComponent],
  exports: [ScreenshotFrameDirective, ScreenshotButtonComponent],
})
export class ScreenshotModule {
  //
}
