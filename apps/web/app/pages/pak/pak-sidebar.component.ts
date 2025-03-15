import { Component, inject, signal } from '@angular/core'
import { LayoutModule } from '~/ui/layout'

import { httpResource } from '@angular/common/http'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { debounceTime } from 'rxjs'
import { FileTreeComponent } from '~/ui/file-tree'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { PakService } from './pak.service'

@Component({
  standalone: true,
  selector: 'nwb-assets-sidebar',
  host: {
    class: 'ion-page',
  },
  imports: [LayoutModule, FileTreeComponent, QuicksearchModule],
  providers: [
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
  template: `
    <ion-header class="bg-base-300">
      <ion-toolbar>
        <nwb-quicksearch-input />
      </ion-toolbar>
    </ion-header>
    <nwb-file-tree
      class="h-full"
      [files]="files.value()"
      [search]="search()"
      [selection]="selection()"
      (selected)="handleFileSelection($event)"
    />
  `,
})
export class PakSidebarComponent {
  private service = inject(PakService)
  protected search = toSignal(inject(QuicksearchService).query$.pipe(debounceTime(1000)))
  protected files = httpResource<string[]>(() => this.service.listUrl('**'))

  private router = inject(Router)
  private route = inject(ActivatedRoute)

  protected selection = signal(this.route.snapshot.queryParams['file'])
  protected handleFileSelection(file: string) {
    this.router.navigate(['.'], {
      queryParams: { file: file },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    })
  }
}
