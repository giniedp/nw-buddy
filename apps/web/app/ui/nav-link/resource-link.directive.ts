import { Directive, Input } from '@angular/core'
import { RouterLink } from '@angular/router'

@Directive({
  standalone: true,
  selector: '[nwbResourceLink]',
  hostDirectives: [RouterLink],
})
export class ResourceLinkDirective {
  @Input()
  public set nwbResourceLink(value: string) {
    this.resourceId = value
  }

  @Input()
  public set nwbResource(value: string) {
    this.resource = value
  }

  public resourceId: string
  public resource: string
}
