import { Directive } from '@angular/core'

@Directive()
export abstract class VirtualGridSectionComponent {
  public abstract set section(value: string)
  public abstract set count(value: number)
}
