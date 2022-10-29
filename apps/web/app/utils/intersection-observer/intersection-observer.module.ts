import { NgModule } from '@angular/core'
import {
  DidIntersectDirective,
  IntersectionChangeDirective,
  IntersectionClassesDirective,
  IntersectionDirective,
  IntersectionEnterDirective,
  IntersectionLeaveDirective,
  IntersectionOptionsDirective,
  IsIntersectingDirective,
} from './intersection.directive'

@NgModule({
  declarations: [
    DidIntersectDirective,
    IntersectionChangeDirective,
    IntersectionClassesDirective,
    IntersectionDirective,
    IntersectionEnterDirective,
    IntersectionLeaveDirective,
    IntersectionOptionsDirective,
    IsIntersectingDirective,
  ],
  exports: [
    DidIntersectDirective,
    IntersectionChangeDirective,
    IntersectionClassesDirective,
    IntersectionDirective,
    IntersectionEnterDirective,
    IntersectionLeaveDirective,
    IntersectionOptionsDirective,
    IsIntersectingDirective,
  ],
})
export class IntersectionObserverModule {}
