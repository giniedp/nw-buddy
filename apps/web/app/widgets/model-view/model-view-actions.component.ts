import { DecimalPipe } from '@angular/common'
import { Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core'
import type { FragmentSummary, FragmentVariant } from '@nw-buddy/viewer'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import {
  svgBurst,
  svgChevronRight,
  svgCircleExclamation,
  svgCrosshairsSimple,
  svgMagnifyingGlass,
  svgRepeat,
  svgWandSparkles,
  svgXmark,
} from '~/ui/icons/svg'
import { humanize } from '~/utils'
import { ActionRow, availableTags, buildActionList, variantLabel, type ActionGroup } from './model-view-actions.model'

/**
 * The fragments of a character for its tags, grouped (attacks, idles, movement, …), one row per fragment playing the
 * variant the game chooses; other variants behind the row's chevron. Fragments of other creatures (shared animation
 * databases) are left out unless shown. Up / down plays the previous / next row, enter plays the row again.
 */
@Component({
  selector: 'nwb-model-view-actions',
  template: `
    <div class="p-2 flex flex-col gap-2 border-b border-base-200">
      <label class="input input-sm w-full">
        <nwb-icon [icon]="iconSearch" class="w-4 h-4 opacity-50" />
        <input
          type="search"
          placeholder="Search animations"
          [value]="search()"
          (input)="search.set($any($event.target).value)"
        />
      </label>
      <div class="flex flex-row flex-wrap items-center gap-1">
        @for (tag of tags(); track tag) {
          <span class="badge badge-sm badge-primary" title="Tag of the model">{{ tag }}</span>
        }
        @for (tag of customTags(); track tag) {
          <span class="badge badge-sm badge-secondary gap-0 pr-0">
            {{ tag }}
            <button class="btn btn-ghost btn-circle btn-xs" title="Remove the tag" (click)="tagRemoved.emit(tag)">
              <nwb-icon [icon]="iconRemove" class="w-3 h-3" />
            </button>
          </span>
        }
        @if (tagOptions().length) {
          <select class="select select-xs w-28" title="Play the variants of another tag" (change)="pickTag($event)">
            <option value="" selected>+ Tag</option>
            @for (tag of tagOptions(); track tag) {
              <option [value]="tag">{{ tag }}</option>
            }
          </select>
        }
      </div>
    </div>
    <div #scroller class="flex-1 min-h-0 overflow-y-auto outline-none" tabindex="0" (keydown)="onKey($event)">
      @for (group of list().groups; track group.category) {
        <button
          class="sticky top-0 z-10 w-full flex flex-row items-center gap-1 px-2 py-1 bg-base-300 text-xs font-bold uppercase text-base-content/70"
          (click)="toggleGroup(group)"
        >
          <nwb-icon
            [icon]="iconChevron"
            class="w-3 h-3 transition-transform"
            [class.rotate-90]="isOpen(group)"
          />
          {{ group.label }}
          <span class="ml-auto font-normal">{{ group.rows.length }}</span>
        </button>
        @if (isOpen(group)) {
          @for (row of group.rows; track row.id) {
            <div class="flex flex-row items-center" [attr.data-row]="row.id" [class.bg-primary/15]="isCurrent(row)">
              <button
                class="flex-1 min-w-0 flex flex-row items-center gap-2 px-2 h-8 text-left text-sm hover:bg-base-content/5 disabled:opacity-40"
                [class.text-primary]="isCurrent(row)"
                [class.italic]="!row.summary.own"
                [disabled]="!row.playable"
                [title]="rowTitle(row)"
                (click)="play(row.variant)"
              >
                <span class="truncate">{{ row.label }}</span>
                <span class="ml-auto flex flex-row items-center gap-1 flex-none opacity-70">
                  @if (row.damage) {
                    <nwb-icon [icon]="iconDamage" class="w-3 h-3 text-error" title="Deals damage" />
                  }
                  @if (row.spell) {
                    <nwb-icon [icon]="iconSpell" class="w-3 h-3 text-warning" title="Casts a spell" />
                  }
                  @if (row.homing) {
                    <nwb-icon [icon]="iconHoming" class="w-3 h-3 text-info" title="Homes in on the target" />
                  }
                  @if (row.loops) {
                    <nwb-icon [icon]="iconLoop" class="w-3 h-3" title="Loops" />
                  }
                  @if (!row.playable) {
                    <nwb-icon [icon]="iconMissing" class="w-3 h-3 text-error" />
                  }
                  @if (duration(row.variant); as seconds) {
                    <span class="text-xs tabular-nums">{{ seconds | number: '1.1-1' }}s</span>
                  }
                </span>
              </button>
              @if (row.others.length) {
                <button
                  class="btn btn-ghost btn-square btn-xs mr-1"
                  [title]="row.others.length + ' more variants'"
                  (click)="toggleRow(row)"
                >
                  <nwb-icon
                    [icon]="iconChevron"
                    class="w-3 h-3 transition-transform"
                    [class.rotate-90]="isExpanded(row)"
                  />
                </button>
              }
            </div>
            @if (isExpanded(row)) {
              @for (variant of row.others; track $index) {
                <button
                  class="w-full flex flex-row items-center gap-2 pl-8 pr-2 h-7 text-left text-xs hover:bg-base-content/5 disabled:opacity-40"
                  [class.text-primary]="variant === current()"
                  [disabled]="!variant.playable"
                  (click)="play(variant)"
                >
                  <span class="truncate">{{ variantLabel(variant) }}</span>
                  @if (duration(variant); as seconds) {
                    <span class="ml-auto tabular-nums opacity-70">{{ seconds | number: '1.1-1' }}s</span>
                  }
                </button>
              }
            }
          }
        }
      } @empty {
        <div class="p-4 text-sm opacity-60">No animations</div>
      }
      @if (list().foreign) {
        <button class="btn btn-ghost btn-xs btn-block my-1" (click)="showForeign.set(!showForeign())">
          @if (showForeign()) {
            Hide the animations of other creatures
          } @else {
            Show {{ list().foreign }} animations of other creatures
          }
        </button>
      }
    </div>
  `,
  imports: [NwModule, IconsModule, DecimalPipe],
  host: {
    class: 'flex flex-col',
  },
})
export class ModelViewActionsComponent {
  /**
   * The fragments of the character for its tags
   */
  public readonly summaries = input<ReadonlyArray<FragmentSummary>>([])
  /**
   * The model's tags
   */
  public readonly tags = input<ReadonlyArray<string>>([])
  /**
   * Tags added by the user
   */
  public readonly customTags = input<ReadonlyArray<string>>([])
  /**
   * The playing variant
   */
  public readonly current = input<FragmentVariant | null>(null)
  /**
   * Seconds of the variants played so far
   */
  public readonly durations = input<ReadonlyMap<FragmentVariant, number>>(new Map())
  public readonly variantClicked = output<FragmentVariant>()
  public readonly tagAdded = output<string>()
  public readonly tagRemoved = output<string>()

  protected iconSearch = svgMagnifyingGlass
  protected iconRemove = svgXmark
  protected iconChevron = svgChevronRight
  protected iconDamage = svgBurst
  protected iconSpell = svgWandSparkles
  protected iconHoming = svgCrosshairsSimple
  protected iconLoop = svgRepeat
  protected iconMissing = svgCircleExclamation
  protected variantLabel = variantLabel

  protected search = signal('')
  protected showForeign = signal(false)
  private openGroups = signal<ReadonlySet<string>>(new Set(['attack']))
  private expandedRows = signal<ReadonlySet<string>>(new Set())
  private scroller = viewChild<ElementRef<HTMLElement>>('scroller')

  protected list = computed(() => {
    return buildActionList(this.summaries(), {
      search: this.search(),
      showForeign: this.showForeign(),
      label: humanize,
    })
  })
  protected tagOptions = computed(() => availableTags(this.summaries(), [...this.tags(), ...this.customTags()]))

  protected isOpen(group: ActionGroup) {
    return !!this.search().trim() || this.openGroups().has(group.category)
  }

  protected toggleGroup(group: ActionGroup) {
    this.openGroups.update((set) => toggled(set, group.category))
  }

  protected isExpanded(row: ActionRow) {
    return this.expandedRows().has(row.id)
  }

  protected toggleRow(row: ActionRow) {
    this.expandedRows.update((set) => toggled(set, row.id))
  }

  protected isCurrent(row: ActionRow) {
    const current = this.current()
    return !!current && current.action === row.summary.action.name
  }

  protected duration(variant: FragmentVariant | null) {
    return variant ? (this.durations().get(variant) ?? null) : null
  }

  protected rowTitle(row: ActionRow) {
    const parts = [row.summary.action.name]
    if (!row.playable) {
      parts.push(row.missing.length ? `Missing animations: ${row.missing.join(', ')}` : 'No variant for the tags')
    } else if (row.variant?.tags.length) {
      parts.push(`Variant: ${variantLabel(row.variant)}`)
    }
    if (!row.summary.own) {
      parts.push('Animation of another creature in the same database')
    }
    return parts.join('\n')
  }

  protected play(variant: FragmentVariant | null) {
    if (variant?.playable) {
      this.variantClicked.emit(variant)
    }
  }

  protected pickTag(event: Event) {
    const select = event.target as HTMLSelectElement
    if (select.value) {
      this.tagAdded.emit(select.value)
    }
    select.value = ''
  }

  /**
   * Up / down: the previous / next playable row of the open groups plays; enter plays the current row again
   */
  protected onKey(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Enter') {
      return
    }
    const rows = this.list()
      .groups.filter((it) => this.isOpen(it))
      .flatMap((it) => it.rows.filter((row) => row.playable))
    if (!rows.length) {
      return
    }
    event.preventDefault()
    const index = rows.findIndex((it) => this.isCurrent(it))
    if (event.key === 'Enter') {
      this.play(rows[Math.max(0, index)].variant)
      return
    }
    const step = event.key === 'ArrowDown' ? 1 : -1
    const next = rows[index < 0 ? 0 : (index + step + rows.length) % rows.length]
    this.play(next.variant)
    this.scroller()
      ?.nativeElement.querySelector(`[data-row="${CSS.escape(next.id)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }
}

function toggled(set: ReadonlySet<string>, key: string): ReadonlySet<string> {
  const result = new Set(set)
  if (result.has(key)) {
    result.delete(key)
  } else {
    result.add(key)
  }
  return result
}
