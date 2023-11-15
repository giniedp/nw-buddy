import { DialogModule } from '@angular/cdk/dialog'
import { LayoutModule as CdkLayoutModule } from '@angular/cdk/layout'
import { CdkMenuModule } from '@angular/cdk/menu'
import { OverlayModule } from '@angular/cdk/overlay'
import { NgModule } from '@angular/core'

import { IonButton, IonButtons, IonHeader, IonMenu, IonMenuToggle, IonModal, IonToolbar } from '@ionic/angular/standalone'
import { DetailDrawerComponent, DetailDrawerContent } from './detail-drawer.component'
import { MenuCloseDirective, MenuConnectorDirective } from './menu.directive'
import { ConfirmDialogComponent, PromptDialogComponent } from './modal'

const COMPONENTS = [
  CdkLayoutModule,
  CdkMenuModule,
  DialogModule,
  OverlayModule,
  MenuConnectorDirective,
  MenuCloseDirective,
  DetailDrawerComponent,
  DetailDrawerContent,
  ConfirmDialogComponent,
  PromptDialogComponent,
  IonModal,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonMenuToggle,
  OverlayModule,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class LayoutModule {}
