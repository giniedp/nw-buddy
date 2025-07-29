import { CdkVirtualForOfContext, CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling'
import { Component, computed, Directive, effect, inject, Input, input, output, signal, viewChild } from '@angular/core'
import type { AdbAction, AdbFragment } from '@nw-viewer/babylon/adb'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgFilm, svgInfoCircle, svgPause, svgPlay, svgPlus, svgTags } from '~/ui/icons/svg'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { humanize } from '~/utils'

@Directive({
  selector: '[cdkVirtualFor]',
})
export class TypeSafeCdkVirtualForDirective<T> {
  @Input() cdkVirtualForDataSource: T[]

  static ngTemplateContextGuard<T>(
    _dir: TypeSafeCdkVirtualForDirective<T>,
    ctx: unknown,
  ): ctx is CdkVirtualForOfContext<T> {
    return true
  }
}

@Component({
  selector: 'nwb-character-action-browser',
  template: `
    <div class="p-2 flex flex-col gap-2">
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
      <div class="flex flex-row gap-1">
        @for (tag of tags(); track $index) {
          <span class="badge badge-sm badge-primary">{{ tag }}</span>
        }
        @for (tag of customTags(); track $index) {
          <span class="badge badge-sm badge-primary pl-0">
            <span (click)="toggleCustomTag(tag); $event.stopPropagation()" class="btn btn-xs btn-circle btn-ghost">
              <nwb-icon [icon]="plusIcon" class="w-4 h-4 transition-transform rotate-45" />
            </span>
            {{ tag }}
          </span>
        }
      </div>
    </div>
    <cdk-virtual-scroll-viewport itemSize="32" class="flex-1" (scrolledIndexChange)="viewport().checkViewportSize()">
      <div
        *cdkVirtualFor="let item of displayList(); trackBy: trackBy; dataSource: displayList()"
        class="whitespace-nowrap overflow-hidden h-8"
      >
        @if (item.fragment) {
          <button
            class="btn btn-ghost btn-sm btn-block justify-start rounded-none"
            (click)="item.playable ? handleClick(item) : null"
          >
            @if (item.playable) {
              <nwb-icon [icon]="playIcon" class="w-4 h-4 text-success" />
            } @else {
              <nwb-icon
                [icon]="errorIcon"
                class="w-4 h-4 tooltip tooltip-error tooltip-right text-error"
                data-tip="Currently not playable"
              />
            }
            @for (tag of item.tags; track $index) {
              <span
                class="badge cursor-pointer pl-0"
                [class.badge-success]="tag.checked"
                [class.badge-error]="!tag.checked"
              >
                <span
                  (click)="toggleCustomTag(tag.label); $event.stopPropagation()"
                  class="btn btn-xs btn-circle btn-ghost"
                >
                  <nwb-icon [icon]="plusIcon" class="w-4 h-4 transition-transform" [class.rotate-45]="tag.checked" />
                </span>
                {{ tag.label }}
              </span>
            } @empty {
              <span class="badge badge-success/25 italic">untagged</span>
            }
          </button>
        } @else {
          <div class=" flex flex-row items-center gap-1 px-2">
            <span class="font-bold text-lg" [class.text-error]="!item.playable">
              {{ item.name }}
            </span>
            <span class="flex-1"> </span>
            @for (tag of item.tags; track $index) {
              <span class="badge pl-0" [class.badge-success]="tag.checked" [class.badge-error]="!tag.checked">
                <span
                  (click)="toggleCustomTag(tag.label); $event.stopPropagation()"
                  class="btn btn-xs btn-circle btn-ghost"
                >
                  <nwb-icon [icon]="plusIcon" class="w-4 h-4 transition-transform" [class.rotate-45]="tag.checked" />
                </span>
                {{ tag.label }}
              </span>
            }
          </div>
        }
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  imports: [NwModule, QuicksearchModule, IconsModule, ScrollingModule, TypeSafeCdkVirtualForDirective],
  providers: [QuicksearchService.provider({})],
  host: {
    class: 'flex flex-col',
  },
})
export class CharacterActionBrowserComponent {
  protected viewport = viewChild(CdkVirtualScrollViewport)
  protected search = inject(QuicksearchService)
  protected customTags = signal<string[]>([])
  protected showAll = signal<boolean>(false)
  protected tagsIcon = svgTags
  protected playIcon = svgPlay
  protected pauseIcon = svgPause
  protected plusIcon = svgPlus
  protected errorIcon = svgInfoCircle
  protected filmIcon = svgFilm
  public tags = input<string[], string[]>([], {
    transform: (value) => value || [],
  })
  public actions = input<AdbAction[], AdbAction[]>([], {
    transform: (value) => value || [],
  })
  public fragmentClicked = output<AdbFragment>()
  protected trackBy = (i: number, item: ActionDisplayItem) => item.id
  protected displayList = computed(() => {
    let result = collectItems(this.actions(), [...this.tags(), ...this.customTags()])
    if (this.search.value()) {
      result = result.filter((item) => {
        return item.name.toLowerCase().includes(this.search.value().toLowerCase())
      })
    }
    if (!this.showAll()) {
      result = result.filter((item) => item.checked)
    }
    return result
  })

  protected addCustomTag(tag: string) {
    if (this.tags().includes(tag)) {
      return
    }
    if (!this.customTags().includes(tag)) {
      this.customTags.update((tags) => [...tags, tag])
    }
  }

  protected removeCustomTag(tag: string) {
    this.customTags.update((tags) => tags.filter((it) => it !== tag))
  }

  protected toggleCustomTag(tag: string) {
    if (this.customTags().includes(tag)) {
      this.removeCustomTag(tag)
    } else {
      this.addCustomTag(tag)
    }
  }

  protected handleClick(item: ActionDisplayItem) {
    if (item.fragment && item.playable) {
      this.fragmentClicked.emit(item.fragment)
    }
  }

  public constructor() {
    effect(() => {
      this.displayList()
      setTimeout(() => this.viewport().checkViewportSize())
    })
  }
}

export interface ActionDisplayItem {
  id: string
  name: string
  tags: ActionDisplayTag[]
  fragment: AdbFragment
  looping?: boolean
  checked?: boolean
  playable?: boolean
}

export interface ActionDisplayTag {
  label: string
  checked: boolean
}

function collectItems(actions: AdbAction[], tags: string[]) {
  const result: ActionDisplayItem[] = []
  let id = 0
  actions = [...actions].sort((a, b) => a.name.localeCompare(b.name))
  for (const action of actions) {
    result.push({
      id: `action-${id++}`,
      name: humanize(action.name),
      tags: [],
      fragment: null,
      playable: action.valid,
    })
    const parent = result[result.length - 1]
    let fragIds = 0
    for (const fragment of action.fragments) {
      result.push({
        id: `fragment-${fragIds++}`,
        name: humanize(action.name),
        tags: (fragment.tags || []).map((tag) => {
          return {
            label: tag,
            checked: tags.includes(tag),
          }
        }),
        fragment: fragment,
        looping: fragment.animLayers?.some((it) => it.sequence.some((it) => it.loop)),
        playable: action.valid,
      })
      const child = result[result.length - 1]
      child.checked = child.tags.every((tag) => tag.checked)
      parent.checked = parent.checked || child.checked
    }
  }
  return result
}
