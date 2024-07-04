import { animate, style, transition, trigger } from '@angular/animations'
import { CommonModule, NgClass } from '@angular/common'
import { Component, ElementRef, HostBinding, Injector, Input, TemplateRef, Type, inject } from '@angular/core'
import { twMerge } from 'tailwind-merge'
import { NwHtmlService } from '~/nw/nw-html.service'

const DEFAULT_CLASS = [
  'block',
  'rounded-md',
  'text-sm',
  'shadow-md',
  'bg-black',
  'bg-opacity-90',
  'border',
  'border-base-100',
  'overflow-clip',
  'max-w-sm',
]

@Component({
  standalone: true,
  selector: 'nwb-tooltip',
  styleUrls: ['./tooltip.component.scss'],
  template: `
    <ng-container *ngIf="text">{{ text }}</ng-container>
    <ng-template [ngComponentOutlet]="component" [ngComponentOutletInjector]="injector" ]></ng-template>
    <ng-template
      [ngTemplateOutlet]="tpl"
      [ngTemplateOutletContext]="context"
      [ngTemplateOutletInjector]="injector"
    ></ng-template>
  `,
  imports: [CommonModule],
  hostDirectives: [NgClass],
  animations: [
    trigger('animate', [
      transition(':enter', [style({ opacity: 0 }), animate('100ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('100ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class TooltipComponent {
  private html = inject(NwHtmlService)
  @HostBinding('@animate')
  protected animate: void

  @Input()
  public ngClass: string | string[]

  @Input()
  public context: any

  @Input()
  public injector: Injector

  @Input()
  public set content(value: string | TemplateRef<any> | Type<any>) {
    this.text = null
    this.tpl = null
    this.component = null
    if (typeof value === 'string') {
      this.elRef.nativeElement.innerHTML = this.html.sanitize(value)
      this.hostClass.ngClass = twMerge(DEFAULT_CLASS, ['px-2', 'py-1'], this.ngClass)
    } else if (value instanceof TemplateRef) {
      this.tpl = value
      this.hostClass.ngClass = twMerge(DEFAULT_CLASS, this.ngClass)
    } else {
      this.component = value
      this.hostClass.ngClass = twMerge(DEFAULT_CLASS, this.ngClass)
    }
  }

  protected text: string
  protected tpl: TemplateRef<any>
  protected component: Type<any>

  public constructor(
    private hostClass: NgClass,
    private elRef: ElementRef<HTMLElement>,
  ) {
    //
  }
}
