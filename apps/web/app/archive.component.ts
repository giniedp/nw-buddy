import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwDataInterceptor, NwDataService } from './nw'

@Component({
  standalone: true,
  template: '<router-outlet name="v"></router-outlet>',
  host: {
    class: 'layout-col',
  },
  imports: [CommonModule, RouterModule],
  providers: [HttpClient, NwDataInterceptor.provide(), NwDataService],
})
export class ArchiveComponent {}
