import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, of, switchMap, tap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { nwdbLinkUrl, NwDbService, NwModule } from '~/nw'
import { NwExpEval, NwExpJoin, parseNwExpression } from '~/nw/utils'
import { DataTableAdapter, DataTableCategory, DataTableModule } from '~/ui/data-table'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'

export interface FaultRow {
  perk: Perks
  expressions: Array<{
    lang: string
    text: string
    expr: string
  }>
}

const KNOWN_LANG = [
  { value: 'en-us', label: 'EN' },
  { value: 'de-de', label: 'DE' },
  { value: 'es-es', label: 'ES' },
  { value: 'fr-fr', label: 'FR' },
  { value: 'it-it', label: 'IT' },
  { value: 'pl-pl', label: 'PL' },
  { value: 'pt-br', label: 'BR' },
]

@Component({
  standalone: true,
  selector: 'nwb-expr-faults-page',
  templateUrl: './expr-faults.component.html',
  styleUrls: ['./expr-faults.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, QuicksearchModule, DataTableModule],
  providers: [QuicksearchService],
  host: {
    class: 'layout-col bg-base-100',
  },
})
export class ExprFaultsComponent extends DataTableAdapter<FaultRow> {
  public entityID(item: FaultRow): string | number {
    return item.perk.PerkID
  }

  public entityCategory(item: FaultRow): string | DataTableCategory | (string | DataTableCategory)[] {
    return null
  }

  public options: Observable<GridOptions<FaultRow>> = defer(() =>
    of<GridOptions<FaultRow>>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 62,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              href: nwdbLinkUrl('perk', data.perk.PerkID),
              target: '_blank',
              icon: data.perk.IconPath,
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          sortable: true,
          filter: true,
          width: 250,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.perk.DisplayName)),
          cellRenderer: this.cellRenderer(({ value }) => this.makeLineBreaks(value)),
          cellClass: ['multiline-cell', 'py-2'],
          autoHeight: true,
          getQuickFilterText: ({ value }) => value,
        }),
        ...KNOWN_LANG.map((it, i) =>
          this.colDef({
            colId: `lang-${it.value}`,
            filter: false,
            cellClass: ['multiline-cell', 'py-2'],
            autoHeight: true,
            headerValueGetter: () => it.label,
            width: 400,
            valueGetter: this.valueGetter(({ data }) => data.expressions[i].expr),
          })
        ),
      ],
    })
  )
  public entities: Observable<FaultRow[]> = defer(() => this.getFaultRows())

  protected adapter = this

  public constructor(private nwDb: NwDbService, private i18n: TranslateService, protected search: QuicksearchService) {
    super()
  }

  private getFaultRows() {

    const loadLang$ = combineLatest(KNOWN_LANG.map((it) => {
      return this.i18n.loader.loadTranslations(it.value).pipe(tap((data) => this.i18n.merge(it.value, data))).pipe(map(() => it))
    }))

    return combineLatest({
      lang: loadLang$,
      perks: this.nwDb.perks,
    }).pipe(
      switchMap(({ perks }) => combineLatest(this.mapPerks(perks))),
      map((perks): FaultRow[] => {
        return perks.filter((it) => {
          const first = it.expressions[0]
          return it.expressions.some((other) => other.expr !== first.expr)
        })
      })
    )
  }

  private mapPerks(perks: Perks[]) {
    return perks.map((perk) => {
      const expressions = KNOWN_LANG.map((lang) => combineLatest({
        lang: of(lang.value),
        text: of(this.i18n.get(perk.Description, lang.value)),
        expr: this.extractEpxression(perk.Description, lang.value)
      }))
      return combineLatest({
        perk: of(perk),
        expressions: combineLatest(expressions)
      })
    })
  }
  private extractEpxression(key: string, lang: string) {
    const text = this.i18n.get(key, lang)
    const root = parseNwExpression(text, true) as NwExpJoin
    const children = root.children.filter((it) => it instanceof NwExpEval)
    const splits = children.map((it) => it.print()).sort()
    return of(splits.join(' '))
  }
}
