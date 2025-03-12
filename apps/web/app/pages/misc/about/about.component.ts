import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { RouterModule } from '@angular/router'
import { environment } from 'apps/web/environments/environment'
import { NwModule } from '~/nw'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService } from '~/utils'

@Component({
  selector: 'nwb-about-page',
  templateUrl: './about.component.html',
  imports: [CommonModule, TooltipModule, RouterModule, NwModule],
  host: {
    class: 'layout-col',
  },
})
export class AboutComponent implements OnInit {
  public get version() {
    return environment.version
  }

  public get gameVersion() {
    const version = environment.version.split('-')[0]
    if (environment.isPTR) {
      return `Public Test Realm ${version}`
    }
    return version
  }

  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      title: 'About New World Buddy',
    })
  }

  ngOnInit(): void {}
}
