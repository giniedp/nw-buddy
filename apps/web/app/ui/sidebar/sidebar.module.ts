import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { SidebarComponent } from './sidebar.component'
import { FormsModule } from '@angular/forms'
import { SidebarRouterDirective } from './sidebar-router.directive'

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [SidebarComponent, SidebarRouterDirective],
  exports: [SidebarComponent, SidebarRouterDirective],
})
export class SidebarModule {}
