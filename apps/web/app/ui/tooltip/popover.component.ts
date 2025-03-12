import { CommonModule } from '@angular/common'
import { Component, Input, TemplateRef } from '@angular/core'

@Component({
  selector: 'nwb-popover',
  template: ` <ng-container [ngTemplateOutlet]="content" /> `,
  imports: [CommonModule],
  host: {
    class: 'block',
  },
})
export class PopoverComponent {
  @Input()
  public content: TemplateRef<any>
}
