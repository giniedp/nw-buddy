import { NgModule } from '@angular/core'
import { LayoutModule as CdkLayoutModule } from '@angular/cdk/layout'
import { CdkMenuModule } from '@angular/cdk/menu'
import { OverlayModule } from '@angular/cdk/overlay'
import { DialogModule } from '@angular/cdk/dialog'

import { MenuCloseDirective, MenuConnectorDirective as MenuConnectorDirective } from './menu.directive'
import { DetailDrawerComponent } from './detail-drawer.component'
import { ConfirmDialogComponent, PromptDialogComponent } from './modal'

const COMPONENTS = [
  CdkLayoutModule,
  CdkMenuModule,
  DialogModule,
  OverlayModule,
  MenuConnectorDirective,
  MenuCloseDirective,
  DetailDrawerComponent,
  ConfirmDialogComponent,
  PromptDialogComponent,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class LayoutModule {}
