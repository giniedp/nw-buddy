import { CommonModule, NgClass } from '@angular/common'
import { Component, ElementRef, Injector, Input, TemplateRef, Type, inject } from '@angular/core'
import { twMerge } from 'tailwind-merge'
import { NwHtmlService } from '~/nw/nw-html.service'

const DEFAULT_CLASS = [
  'block',
  'rounded-md',
  'text-sm',
  'shadow-md',
  'bg-black/90',
  'border',
  'border-base-100',
  'overflow-clip',
  'max-w-sm',
]

@Component({
  selector: 'nwb-tooltip',
  styleUrl: './tooltip.component.css',
  template: `
    @if (text) {
      {{ text }}
    }
    <ng-template [ngComponentOutlet]="component" [ngComponentOutletInjector]="injector" ] />
    <ng-template [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="context" [ngTemplateOutletInjector]="injector" />
  `,
  imports: [CommonModule],
  hostDirectives: [NgClass],
  host: {
    '[class.tooltip-active]': 'active',
    '[style.--tooltip-fade-time.ms]': 'fadeTime',
  },
})
export class TooltipComponent {
  private html = inject(NwHtmlService)

  @Input()
  public ngClass: string | string[]

  @Input()
  public context: any

  @Input()
  public injector: Injector

  @Input()
  public active: boolean

  @Input()
  public fadeTime: number = 150

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
