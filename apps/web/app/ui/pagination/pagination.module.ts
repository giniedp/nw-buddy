import { NgModule } from '@angular/core'
import { InfiniteScrollTrigger } from './infinite-scroll-trigger.directive'
import { InfiniteScrollDirective } from './infinite-scroll.directive'

@NgModule({
  imports: [InfiniteScrollDirective, InfiniteScrollTrigger],
  exports: [InfiniteScrollDirective, InfiniteScrollTrigger],
})
export class PaginationModule {}
