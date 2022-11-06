import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-icon',
  template: '',
  styles: [`
    ::ng-deep svg {
      max-height: 100%;
      max-width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block flex items-center justify-center'
  }
})
export class SvgIconComponent {
  @Input()
  public set icon(value: string) {
    this.updateIcon(value)
  }

  public constructor(private elRef: ElementRef<HTMLElement>) {
    //
  }

  private updateIcon(data: string) {
    this.elRef.nativeElement.innerHTML = data
  }
}
