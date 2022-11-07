import { NgModule } from "@angular/core"
import { TooltipComponent } from "./tooltip.component";
import { TooltipDirective } from "./tooltip.directive";

@NgModule({
  imports: [TooltipDirective, TooltipComponent],
  exports: [TooltipDirective, TooltipComponent]
})
export class TooltipModule {

}
