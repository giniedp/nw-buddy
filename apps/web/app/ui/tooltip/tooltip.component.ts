import { animate, style, transition, trigger } from '@angular/animations'
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
  `,
  imports: [CommonModule],
  host: {
    class: 'rounded-md fs-sm',
    '[class.px-2]': '!!text',
    '[class.py-1]': '!!text',
  },
  animations: [
    trigger('animate', [
      transition(':enter', [style({ opacity: 0 }), animate('100ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('100ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class TooltipComponent {

  @HostBinding('@animate')
  protected animate: void

  @Input()
  @HostBinding('class')
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
