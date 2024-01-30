import { DialogModule } from '@angular/cdk/dialog'
import { LayoutModule as CdkLayoutModule } from '@angular/cdk/layout'
import { CdkMenuModule } from '@angular/cdk/menu'
import { OverlayModule } from '@angular/cdk/overlay'
import { NgModule } from '@angular/core'

import {
  IonContent,
  IonHeader,
  IonMenu,
  IonMenuToggle,
  IonModal,
  IonRouterOutlet,
  IonSplitPane,
  IonToolbar,
} from '@ionic/angular/standalone'

import { MenuCloseDirective, MenuConnectorDirective } from './menu.directive'
import { ConfirmDialogComponent, PromptDialogComponent } from './modal'

import { BreakpointPipe } from './pipes/breakpoint.pipe'
import { Px2VhPipe } from './pipes/px2vh.pipe'

const COMPONENTS = [
  CdkLayoutModule,
  CdkMenuModule,
  DialogModule,
  OverlayModule,
  MenuConnectorDirective,
  MenuCloseDirective,
  ConfirmDialogComponent,
  PromptDialogComponent,
  IonModal,
  IonContent,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonModal,
  OverlayModule,
  BreakpointPipe,
  Px2VhPipe,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
  providers: [BreakpointPipe],
})
export class LayoutModule {}
