import { ChangeDetectionStrategy, Component, effect, ElementRef, HostBinding, inject, input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'nwb-icon',
  template: '',
  styleUrl: './icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex items-center justify-center',
  },
})
export class SvgIconComponent {
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef)

  public icon = input<string>()

  @HostBinding('style.width.px')
  public width: number = null

  @HostBinding('style.height.px')
  public height: number = null

  #fx = effect(() => {
    const value = this.icon()
    const el = this.elRef.nativeElement
    if (!value) {
      el.innerHTML = ''
    } else if (isSvg(value)) {
      el.innerHTML = value
    } else {
      el.innerHTML = `<img src="${value}"/>`
    }
  })
}

function isSvg(value: string): boolean {
  return value?.includes('<svg')
}
