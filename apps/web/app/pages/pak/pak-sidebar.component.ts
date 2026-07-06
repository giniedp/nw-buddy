import { Component, TemplateRef, computed, inject, model, signal, viewChild } from '@angular/core'
import { LayoutModule, ModalService } from '~/ui/layout'

import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { Asset, AssetInfo } from '@nw-serve'
import { debounceTime, of } from 'rxjs'
import { FileTreeComponent } from '~/ui/file-tree'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { FileTreeNode } from '../../ui/file-tree/file-tree.store'
import { IconsModule } from '../../ui/icons'
import { svgChevronRight, svgHashtag, svgMagnifyingGlass } from '../../ui/icons/svg'
import { PropertyGridModule } from '../../ui/property-grid'
import { PakService } from './pak.service'

@Component({
  standalone: true,
  selector: 'nwb-assets-sidebar',
  host: {
    class: 'ion-page',
  },
  imports: [LayoutModule, FileTreeComponent, QuicksearchModule, PropertyGridModule, IconsModule, FormsModule],
  providers: [
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
  template: `
    <ion-header class="bg-base-300">
      <ion-toolbar>
        <nwb-quicksearch-input class="m-1 ml-2" />
        <button class="btn btn-sm btn-square mr-1" slot="end" (click)="handleOpenUuidModal()">
          <nwb-icon [icon]="uuidIcon" class="w-5 h-5" />
        </button>
      </ion-toolbar>
    </ion-header>
    <div class="h-full flex flex-col">
      @if (files.isLoading()) {
        <div class="h-full flex items-center justify-center">
          <span class="loading loading-spinner"></span>
        </div>
      } @else {
        <nwb-file-tree
          class="px-2 flex-1"
          [files]="files.value()"
          [search]="search()"
          [selection]="selection()"
          (selected)="handleFileSelection($event)"
          (open)="handleOpen($event)"
        />
        <div class="flex-none h-8 text-sm font-bold bg-base-300 px-2 flex flex-row items-center uppercase">
          Properties
        </div>
        <div class="flex-none h-64 overflow-auto p-2 bg-base-200">
          @if (fileStatResource.isLoading()) {
            <div class="h-full flex items-center justify-center">
              <span class="loading loading-spinner"></span>
            </div>
          } @else if (fileStatResource.error()) {
            <div class="text-error">
              {{ fileStatResource.error() }}
            </div>
          } @else if (fileStat()) {
            <nwb-property-grid [item]="fileStat()" class="text-xs" />
          }
        </div>
      }
    </div>
    <ng-template #uuidDialog>
      <ion-header class="bg-base-300">
        <ion-toolbar>
          <ion-title>UUID Search</ion-title>
          <button slot="end" class="btn btn-sm btn-circle btn-neutral mr-2" [nwbModalClose]>&times;</button>
        </ion-toolbar>
        <ion-toolbar class="bg-base-200" [style.--min-height.px]="0">
          <div class="join w-full p-2">
            <div class="w-full">
              <label class="input input-sm join-item w-full">
                <nwb-icon [icon]="searchIcon" class="w-5 h-5" />
                <input type="search" placeholder="deadbeef-dead-beef-dead-beefdeadbeef" [(ngModel)]="uuidValue" />
              </label>
            </div>
            <button class="btn btn-sm btn-square join-item" (click)="uuidShowFilter.set(!uuidShowFilter())">
              <nwb-icon [icon]="chevronIcon" class="w-4 h-4" [class.rotate-90]="uuidShowFilter()" />
            </button>
          </div>
          @if (uuidShowFilter()) {
            <div class="join w-full p-2 pt-0">
              <div class="w-full">
                <label class="input input-sm join-item w-full">
                  <input type="search" placeholder="Filter" [(ngModel)]="uuidFilter" />
                </label>
              </div>
            </div>
          }
        </ion-toolbar>
      </ion-header>
      <ion-content class="bg-base-200 ion-p-4">
        @if (uuidSearch.isLoading()) {
          <div class="flex items-center justify-center p-10">
            <span class="loading loading-spinner"></span>
          </div>
        } @else if (uuidSearch.error()) {
          <div class="text-error">
            {{ uuidSearch.error() }}
          </div>
        } @else if (!uuidSearch.value()) {
          <div class="text-muted text-sm text-center p-10">Enter a UUID to look up the corresponding asset.</div>
        } @else {
          <ul class="list bg-base-100 rounded-box shadow-md">
            @for (row of uuidDisplayResults(); track $index) {
              <li class="list-row">
                <div>
                  <nwb-icon [icon]="uuidIcon" class="w-5 h-5" />
                </div>
                <div>
                  <div><span class="font-bold">UUID:</span> {{ row.guid }}</div>
                  <div><span class="font-bold">SubId:</span> {{ row.subId }} (0x{{ row.subId.toString(16) }})</div>
                  <div><span class="font-bold">Type:</span> {{ row.type }}</div>
                  <div class="text-xs opacity-75">
                    {{ row.file }}
                    @if (row.size) {
                      ({{ fileSize(row.size) }})
                    }
                  </div>
                </div>
                <button class="btn btn-square btn-ghost" (click)="handleOpenUuidAsset(row)">
                  <nwb-icon [icon]="chevronIcon" class="w-5 h-5" />
                </button>
              </li>
            } @empty {
              <li class="list-row bg-warning text-warning-content">
                <div>
                  <nwb-icon [icon]="uuidIcon" class="w-5 h-5" />
                </div>
                <div>
                  <div class="font-bold">No assets found for this UUID.</div>
                </div>
              </li>
            }
          </ul>
        }
      </ion-content>
    </ng-template>
  `,
})
export class PakSidebarComponent {
  private service = inject(PakService)
  private modal = inject(ModalService)

  protected chevronIcon = svgChevronRight
  protected searchIcon = svgMagnifyingGlass
  protected uuidIcon = svgHashtag
  protected uuidTpl = viewChild('uuidDialog', { read: TemplateRef })
  protected uuidValue = model<string>()
  protected uuidShowFilter = signal(false)
  protected uuidFilter = model('')
  protected uuidSearch = rxResource({
    params: this.uuidValue,
    stream: ({ params }) => {
      if (!params) {
        return of(null)
      }
      return this.service.fetchAsset(params)
    },
  })
  protected uuidDisplayResults = computed(() => {
    const result = this.uuidSearch.value()
    let list: Asset[] = []
    if (result?.asset) {
      list.push(result.asset)
    }
    if (result?.assets) {
      list = [...list, ...result.assets]
    }
    if (this.uuidFilter()) {
      const filter = this.uuidFilter().toLowerCase()
      list = list.filter((it) => {
        return (
          it.file.toLowerCase().includes(filter) ||
          String(it.type).includes(filter) ||
          String(it.subId).includes(filter) ||
          String(it.subId.toString(16)).includes(filter)
        )
      })
    }
    list.sort((a, b) => {
      return (a.subId || 0) - (b.subId || 0)
    })
    return list
  })

  protected search = toSignal(inject(QuicksearchService).query$.pipe(debounceTime(300)))
  protected files = rxResource({
    stream: () => this.service.fetchFileList('**'),
  })

  protected selection = this.service.selectedFileId
  protected fileStatResource = rxResource({
    params: this.selection,
    stream: ({ params }) => (params ? this.service.fetchFileStat(params) : of(null)),
  })
  protected fileStat = computed(() => flattenObject(this.fileStatResource.value()?.[0]))

  public constructor() {
    this.service.searchAsset.pipe(takeUntilDestroyed()).subscribe((query) => {
      this.uuidValue.set(query)
      this.handleOpenUuidModal()
    })
  }

  protected handleFileSelection(file: FileTreeNode) {
    if (!file.isDir) {
      this.service.selectFileId(file.id)
    }
  }

  protected handleOpen(file: FileTreeNode) {
    if (!file.isDir) {
      this.service.openFileInNewTab(file.id)
    }
  }

  protected handleOpenUuidModal() {
    this.modal.open({
      content: this.uuidTpl(),
    })
  }

  protected handleOpenUuidAsset(asset: AssetInfo) {
    this.service.selectFileId(asset.file)
  }

  protected fileSize(size: number) {
    if (size < 1024) {
      return size + ' B'
    }
    if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB'
    }
    if (size < 1024 * 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(2) + ' MB'
    }
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }
}

function flattenObject(obj: Record<string, any>, separator = '.'): Record<string, any> {
  const result: Record<string, any> = {}

  function recurse(current: any, path: string) {
    if (current === null || current === undefined) {
      result[path] = current
    } else if (typeof current !== 'object' || Array.isArray(current)) {
      result[path] = current
    } else {
      for (const key of Object.keys(current)) {
        recurse(current[key], path ? `${path}${separator}${key}` : key)
      }
    }
  }

  recurse(obj, '')
  return result
}
