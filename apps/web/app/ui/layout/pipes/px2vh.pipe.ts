import { DOCUMENT } from '@angular/common'
import { Pipe, PipeTransform, inject } from '@angular/core'

@Pipe({
  name: 'px2vh',
  standalone: true,
})
export class Px2VhPipe implements PipeTransform {
  private win = inject(DOCUMENT).defaultView

  public transform(value: number): number {
    return value / this.win.innerHeight
  }
}
