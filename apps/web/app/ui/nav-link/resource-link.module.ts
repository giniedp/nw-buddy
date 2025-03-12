import { NgModule } from '@angular/core'
import { ResourceLinkDirective } from './resource-link.directive'

const COMPONENTS = [ResourceLinkDirective]

@NgModule({
  imports: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class ResourceLinkModule {}
