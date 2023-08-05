import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-icon',
  template: '',
  styles: [`
    ::ng-deep svg {
      max-height: 100%;
      max-width: 100%;
      width: inherit;
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
    this.elRef.nativeElement.innerHTML = value
  }

  @HostBinding('style.width.px')
  public width: number = null

  @HostBinding('style.height.px')
  public height: number = null

  public constructor(private elRef: ElementRef<HTMLElement>) {
    //
  }
}
