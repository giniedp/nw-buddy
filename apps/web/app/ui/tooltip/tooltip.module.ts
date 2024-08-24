import { NgModule } from '@angular/core'
import { PopoverComponent } from './popover.component'
import { PopoverDirective } from './popover.directive'
import { TooltipComponent } from './tooltip.component'
import { TooltipDirective } from './tooltip.directive'

@NgModule({
  imports: [TooltipDirective, TooltipComponent, PopoverDirective, PopoverComponent],
  exports: [TooltipDirective, TooltipComponent, PopoverDirective, PopoverComponent],
})
export class TooltipModule {}
