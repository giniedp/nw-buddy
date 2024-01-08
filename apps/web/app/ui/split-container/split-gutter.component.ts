import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-split-gutter',
  template: ``,
  host: {
    '[style.order]': 'order',
    '[style.flex-basis.px]': 'size',
  },
})
export class SplitGutterComponent {
  @Input()
  public order: number

  @Input()
  public size: number

  @Input()
  public active: boolean
}
