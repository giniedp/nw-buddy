import { Component, computed, inject, input, model, output } from '@angular/core'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { AdbAction, AdbFragment } from '../nw-adb'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { IconsModule } from '~/ui/icons'
import { svgTags } from '~/ui/icons/svg'

@Component({
  selector: 'nw-adb-action-menu',
  template: `
    <ul
      cdkMenu
      class="dropdown-content menu menu-compact flex-nowrap bg-base-300 bg-opacity-90 border border-base-200 min-w-80 max-h-[50vh] rounded-md shadow-md overflow-y-auto"
    >
      <div class="sticky top-0 p-2 bg-base-300 z-10 ">
        <div class="flex flex-row gap-1">
          <nwb-quicksearch-input class="flex-1" [placeholder]="'Filter'" />
          <button class="btn btn-sm btn-square" (click)="showAll.set(!showAll())">
            <nwb-icon
              [icon]="tagsIcon"
              class="w-5 h-5"
              [class.text-success]="!showAll()"
              [class.text-error]="showAll()"
            />
          </button>
        </div>
        @if (tags()?.length > 0) {
          <div class="flex flex-row gap-1 mt-2">
            @for (tag of tags(); track $index) {
              <span class="badge badge-sm badge-primary">{{ tag }}</span>
            }
          </div>
        }
      </div>
      @for (group of displayActions(); track $index) {
        <li class="menu-title text-neutral-content" (click)="actionClicked.emit(group.action)">
          {{ group.name | nwHumanize }}
        </li>
        @for (item of group.items; track $index; let last = $last) {
          <li [class.mb-4]="last">
            <a
              (click)="!group.disabled ? fragmentClicked.emit(item.fragment) : null"
              [class.opacity-50]="group.disabled"
              [class.cursor-not-allowed]="group.disabled"
            >
              <div class="flex flex-row gap-1">
                @if (item.looping) {
                  <span class="badge badge-info italic bg-opacity-25">looping</span>
                }
                @for (tag of item.tags; track $index) {
                  <span class="badge" [class.badge-success]="tag.checked" [class.badge-error]="!tag.checked">{{
                    tag.label
                  }}</span>
                } @empty {
                  <span class="badge badge-success italic bg-opacity-25">untagged</span>
                }
              </div>
            </a>
          </li>
        }
      }
    </ul>
  `,
  imports: [LayoutModule, NwModule, QuicksearchModule, IconsModule],
  providers: [QuicksearchService.provider({})],
})
export class AdbActionMenuComponent {
  public search = inject(QuicksearchService)
  public tags = input<string[]>([])
  public actions = input<ReadonlyArray<AdbAction>>([])
  public showAll = model<boolean>(false)
  public tagsIcon = svgTags
  public displayActions = computed(() => {
    const tags = this.tags() || []
    const actions = this.actions()
    return actions
      .map((action): MenuGroup => {
        return {
          name: action.name,
          action: action,
          disabled: !action.valid,
          items: action.fragments
            .map((fragment): MenuItem => {
              return {
                looping: fragment.animLayers?.some((it) => it.sequence.some((it) => it.loop)),
                fragment: fragment,
                tags: fragment.tags.map((tag) => {
                  return {
                    label: tag,
                    checked: tags.includes(tag),
                  }
                }),
              }
            })
            .filter((it) => {
              if (this.showAll()) {
                return true
              }
              return it.tags.every((tag) => tag.checked)
            }),
        }
      })
      .filter((it) => {
        if (this.search.value() && !it.name.toLowerCase().includes(this.search.value().toLowerCase())) {
          return false
        }
        if (this.showAll()) {
          return true
        }
        return it.items.length > 0 && !it.disabled
      })
  })

  public actionClicked = output<AdbAction>()
  public fragmentClicked = output<AdbFragment>()
}

export interface MenuGroup {
  name: string
  disabled: boolean
  action: AdbAction
  items: MenuItem[]
}

export interface MenuItem {
  fragment: AdbFragment
  looping: boolean
  tags: Array<{ label: string; checked: boolean }>
}
