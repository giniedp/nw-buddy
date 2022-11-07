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
    class: 'px-2 py-1 rounded-md fs-sm'
  }
})
export class TooltipComponent {

  @Input()
  public show: boolean

  @Input()
  public color: '' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'

  @HostBinding('class')
  public get elementClass() {
    return {
      show: this.show,
      [this.color]: true
    }
  }

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
