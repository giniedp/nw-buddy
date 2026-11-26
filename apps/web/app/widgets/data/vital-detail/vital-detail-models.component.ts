import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import type { TimelineBar, TrackBarLink } from '@nw-buddy/viewer'
import { injectNwData } from '~/data'
import { LocaleService } from '~/i18n/locale.service'
import { NwModule } from '~/nw'
import { buddyLinkUrl } from '~/nw/nw-link'
import { eqCaseInsensitive } from '~/utils'
import { environment } from 'apps/web/environments'
import { ModelViewComponent } from '~/widgets/model-view'
import { ModelsService, type ModelItemInfo } from '~/widgets/model-viewer/model-viewer.service'
import { loadVitalDamageTables, selectVitalDamageTableNames } from './vital-damage-tables'
import { VitalDetailStore } from './vital-detail.store'

/**
 * The models of a vital with their animations: the fragment list and the track bar of the playing fragment, damage
 * bars link to the damage rows of the shown model's table, then of the vital's other ones
 */
@Component({
  selector: 'nwb-vital-detail-models',
  template: `
    @defer {
      <nwb-model-view
        [models]="models()"
        [actions]="true"
        [tracks]="true"
        [trackLink]="trackLink()"
        [ownIds]="ownIds()"
        [downloads]="true"
        (modelSelected)="model.set($event)"
        class="block aspect-square relative"
      />
    } @placeholder {
      <div class="aspect-square skeleton"></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ModelViewComponent],
  host: {
    class: 'block',
  },
})
export class VitalDetailModelsComponent {
  protected store = inject(VitalDetailStore)
  private db = injectNwData()
  private locale = inject(LocaleService)

  protected models = toSignal(inject(ModelsService).byVitalsId(toObservable(this.store.vitalId)))
  protected model = signal<ModelItemInfo | null>(null)

  /**
   * The damage table files: the shown model's first
   */
  private files = computed(
    () => {
      const table = this.model()?.damageTable
      const tables = selectVitalDamageTableNames(this.store.vitalId(), this.store.metadata())
      if (!table) {
        return tables
      }
      return [table, ...tables.filter((it) => !eqCaseInsensitive(it, table))]
    },
    { equal: (a, b) => a.join() === b.join() },
  )

  /**
   * The names of the tables by their rows, and the rows and spells of all tables (ids lower case)
   */
  private damage = resource({
    params: () => this.files(),
    loader: async ({ params: files }) => {
      const tables = await loadVitalDamageTables(this.db, files)
      const tableByRow = new Map<string, string>()
      for (const table of tables) {
        for (const row of table.rows || []) {
          const id = row.DamageID?.toLowerCase()
          if (id && !tableByRow.has(id)) {
            tableByRow.set(id, table.name)
          }
        }
      }
      const spells = await Promise.all(tables.map((table) => this.db.spellsByDamageTable(table.name)))
      const own = new Set(tableByRow.keys())
      for (const spell of spells.flat()) {
        if (spell?.SpellID) {
          own.add(spell.SpellID.toLowerCase())
        }
      }
      return { tableByRow, own }
    },
  })

  /**
   * The ids the vital's fragments refer to (damage rows, spells): fragments of other creatures are left out
   */
  protected ownIds = computed(() => (this.damage.hasValue() ? this.damage.value().own : null))

  /**
   * A damage bar links to its row when a table of the vital has it
   */
  protected trackLink = computed(() => {
    const tableByRow = this.damage.hasValue() ? this.damage.value().tableByRow : null
    const lang = this.locale.value()
    return (bar: TimelineBar): TrackBarLink | null => {
      const row = bar.procedural?.params['DamageTableRow']
      if (typeof row !== 'string' || !row) {
        return null
      }
      const table = tableByRow?.get(row.toLowerCase())
      if (!table) {
        return null
      }
      const href = buddyLinkUrl({ type: 'damage', id: `${table}-${row}`, lang, ptr: environment.isPTR })
      return { label: `Damage: ${row}`, href: `${href}?search=${encodeURIComponent(row)}` }
    }
  })
}
