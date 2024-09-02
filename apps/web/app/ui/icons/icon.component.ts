import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-icon',
  template: '',
  styles: [
    `
      ::ng-deep svg,
      ::ng-deep img {
        max-height: 100%;
        max-width: 100%;
        width: inherit;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex items-center justify-center',
  },
})
export class SvgIconComponent {
  @Input()
  public set icon(value: string) {
    if (!value) {
      this.elRef.nativeElement.innerHTML = ''
    } else if (isSvg(value)) {
      this.elRef.nativeElement.innerHTML = value
    } else {
      this.elRef.nativeElement.innerHTML = `<img src="${value}"/>`
    }
  }

  @HostBinding('style.width.px')
  public width: number = null

  @HostBinding('style.height.px')
  public height: number = null

  public constructor(private elRef: ElementRef<HTMLElement>) {
    //
  }
}

function isSvg(value: string): boolean {
  return value?.includes('<svg')
}
