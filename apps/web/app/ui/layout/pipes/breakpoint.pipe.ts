import { BreakpointObserver } from '@angular/cdk/layout'
import { inject, Pipe, PipeTransform } from '@angular/core'
import { Observable, map, startWith } from 'rxjs'

@Pipe({
  name: 'nwbBreakpoint',
  standalone: true,
})
export class BreakpointPipe implements PipeTransform {
  private breakpointObserver = inject(BreakpointObserver)

  public transform(value: string): Observable<boolean> {
    return this.breakpointObserver.observe(value).pipe(
      map((state) => state.matches),
      startWith(this.breakpointObserver.isMatched(value)),
    )
  }
}
