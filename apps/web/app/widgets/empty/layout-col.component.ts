import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { RouterModule } from '@angular/router'

@Component({
  standalone: true,
  template: '<router-outlet></router-outlet>',
  host: {
    class: 'layout-col',
  },
  imports: [CommonModule, RouterModule],
})
export class LayoutColComponent {}
