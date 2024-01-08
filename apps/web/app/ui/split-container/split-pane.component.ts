import { Component, ElementRef, Input, inject } from '@angular/core'
import { SplitPaneOptions } from './types'

@Component({
  standalone: true,
  selector: 'nwb-split-pane',
  template: `<ng-content></ng-content>`,
  host: {
    class: 'flex-1',
  },
})
export class SplitPaneComponent {
  @Input()
  public cid: string

  @Input()
  public order: number

  @Input()
  public size: number

  @Input()
  public minSize: number

  @Input()
  public options: SplitPaneOptions

  public readonly elRef = inject(ElementRef<HTMLElement>)
}
