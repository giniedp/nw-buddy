import { ContentObserver } from '@angular/cdk/observers'
import { AfterContentInit, DestroyRef, Directive, ElementRef, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'

@Directive({
  selector: '[nwbFlash]',
  standalone: true,
})
export class FlashDirective implements AfterContentInit {
  private elRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>)
  private service = inject(ContentObserver)
  private destoryRef = inject(DestroyRef)

  public ngAfterContentInit(): void {
    this.service
      .observe(this.elRef.nativeElement)
      .pipe(takeUntilDestroyed(this.destoryRef))
      .subscribe(() => {
        this.elRef.nativeElement.animate(
          [{ color: 'inherit' }, { color: 'red' }, { color: 'inherit' }, { color: 'red' }, { color: 'inherit' }],
          {
            duration: 600,
          },
        )
      })
  }
}
