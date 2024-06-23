import { Component } from '@angular/core'
import { RouterModule } from '@angular/router'

@Component({
  selector: 'nw-buddy-frame',
  standalone: true,
  template: `<router-outlet />`,
  imports: [RouterModule],
  host: {
    class: 'ion-page',
  },
})
export class AppFrameComponent {}
