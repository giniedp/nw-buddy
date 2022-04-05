import { Directive, ElementRef, Input, Renderer2 } from '@angular/core'

@Directive({
  selector: '[nwRarityBg]',
})
export class NwRarityBgDirective {
  @Input()
  public set nwRarityBg(value: number | string) {
    this.renderer.removeClass(this.elRef.nativeElement, `bg-rarity-${this.value}`)
    this.value = value
    this.renderer.addClass(this.elRef.nativeElement, `bg-rarity-${this.value}`)
  }

  private value: string | number

  public constructor(private renderer: Renderer2, private elRef: ElementRef<HTMLElement>) {}
}
