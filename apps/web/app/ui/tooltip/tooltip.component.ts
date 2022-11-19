import { CommonModule } from '@angular/common'
import { Component, HostBinding, Input, TemplateRef, Type } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-tooltip',
  styleUrls: ['./tooltip.component.scss'],
  template: `
    <ng-container *ngIf="text">{{ text }}</ng-container>
    <ng-container *ngComponentOutlet="component"></ng-container>
    <ng-container *ngTemplateOutlet="tpl"></ng-container>
    <ng-content></ng-content>
  `,
  imports: [CommonModule],
  host: {
    class: 'rounded-md fs-sm',
    '[class.primary]': 'color == "primary"',
    '[class.secondary]': 'color == "secondary"',
    '[class.accent]': 'color == "accent"',
    '[class.info]': 'color == "info"',
    '[class.success]': 'color == "success"',
    '[class.warning]': 'color == "warning"',
    '[class.error]': 'color == "error"',
    '[class.px-2]': '!!text',
    '[class.py-1]': '!!text'
  }
})
export class TooltipComponent {

  @Input()
  @HostBinding('class.show')
  public show: boolean

  @Input()
  public color: '' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'

  @Input()
  public set content(value: string | TemplateRef<any> | Type<any>) {
    this.text = null
    this.tpl = null
    this.component = null
    if (typeof value === 'string') {
      this.text = value
    } else if (value instanceof TemplateRef) {
      this.tpl = value
    } else {
      this.component = value
    }
  }

  protected text: string
  protected tpl: TemplateRef<any>
  protected component: Type<any>
}
