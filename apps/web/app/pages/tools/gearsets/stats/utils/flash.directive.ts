import { ContentObserver } from '@angular/cdk/observers'
import { AfterContentInit, DestroyRef, Directive, ElementRef, Renderer2, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { delay, skip, tap } from 'rxjs'

@Directive({
  selector: '[nwbFlash]',
  standalone: true,
})
export class FlashDirective implements AfterContentInit {
  private elRef = inject(ElementRef<HTMLElement>)
  private renderer = inject(Renderer2)
  private service = inject(ContentObserver)
  private destoryRef = inject(DestroyRef)

  public ngAfterContentInit(): void {
    this.service
      .observe(this.elRef.nativeElement)
      .pipe(
        tap(() => { this.renderer.addClass(this.elRef.nativeElement, 'text-error') }),
        delay(1000),
        tap(() => { this.renderer.removeClass(this.elRef.nativeElement, 'text-error') }),
        takeUntilDestroyed(this.destoryRef),
      )
      .subscribe()
  }
}
