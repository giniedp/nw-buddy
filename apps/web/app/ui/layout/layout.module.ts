import { DialogModule } from '@angular/cdk/dialog'
import { LayoutModule as CdkLayoutModule } from '@angular/cdk/layout'
import { CdkMenuModule } from '@angular/cdk/menu'
import { OverlayModule } from '@angular/cdk/overlay'
import { NgModule } from '@angular/core'

import {
  IonContent,
  IonFooter,
  IonHeader,
  IonMenu,
  IonMenuToggle,
  IonModal,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone'

import { MenuCloseDirective, MenuConnectorDirective } from './menu.directive'
import { ConfirmDialogComponent, PromptDialogComponent } from './modal'

import { BreakpointPipe } from './pipes/breakpoint.pipe'
import { Px2VhPipe } from './pipes/px2vh.pipe'
import { IonContentDirective } from './ion-content.directive'
import { SizeObserverDirective } from './resize-observer.directive'

const COMPONENTS = [
  BreakpointPipe,
  CdkLayoutModule,
  CdkMenuModule,
  ConfirmDialogComponent,
  DialogModule,
  IonContent,
  IonContentDirective,
  IonFooter,
  IonHeader,
  IonTitle,
  IonMenu,
  IonMenuToggle,
  IonModal,
  IonRouterOutlet,
  IonSplitPane,
  IonToolbar,
  MenuCloseDirective,
  MenuConnectorDirective,
  OverlayModule,
  OverlayModule,
  PromptDialogComponent,
  Px2VhPipe,
  SizeObserverDirective,
]
@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
  providers: [BreakpointPipe],
})
export class LayoutModule {}
