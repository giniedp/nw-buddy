import { Injectable } from '@angular/core'
import { Gamemodes, Vitals } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable } from 'rxjs'
import { nwdbLinkUrl, NwDbService, NwVitalsService } from '~/core/nw'
import { RangeFilter, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/core/utils'
import m from 'mithril'
import { TranslateService } from '~/core/i18n'
import { getVitalDungeon, getVitalDungeonId } from '~/core/nw/utils'

export interface Entity extends Vitals {
  $dungeon: Gamemodes
}

@Injectable()
export class VitalsAdapterService extends DataTableAdapter<Entity> {
  public entityID(item: Vitals): string {
    return item.VitalsID
  }

  public entityCategory(item: Vitals): string {
    return item.Family
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return {
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          width: 200,
          headerName: 'Name',
          pinned: true,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.DisplayName)),
          getQuickFilterText: ({ value }) => value,
          cellRenderer: this.mithrilCell({
            view: ({ attrs }) =>
              m(
                'a',
                {
                  href: nwdbLinkUrl('creature', attrs.data.VitalsID),
                  target: '_blank',
                },
                [attrs.value]
              ),
          }),
        },
        {
          width: 200,
          field: this.fieldName('Level'),
          cellRenderer: this.mithrilCell({
            view: ({ attrs }) => {
              const icon = this.vitals.vitalMarkerIcon(attrs.data)
              return m('div.relative.h-full.w-full', [
                icon &&
                  m('img.block.object-cover.absolute.left-0.top-0.h-full.w-full', {
                    src: icon,
                  }),
                m('span.absolute.left-0.right-0.top-0.bottom-0.text-center.font-bold', attrs.value),
              ])
            },
          }),
        },
        {
          field: this.fieldName('Family'),
          width: 125,
          getQuickFilterText: ({ value }) => value,
          filter: SelectboxFilter,
        },
        {
          width: 150,
          field: this.fieldName('CreatureType'),
          valueFormatter: ({ value }) => humanize(value),
          getQuickFilterText: ({ value }) => value,
          filter: SelectboxFilter,
        },
        {
          field: this.fieldName('LootDropChance'),
          cellClass: 'text-right',
          width: 150,
          filter: RangeFilter,
          valueGetter: this.valueGetter(({ data }) => Math.round((Number(data.LootDropChance) || 0) * 100)),
          valueFormatter: ({ value }) => `${value}%`,
        },
        {
          headerName: 'Dungeon',
          valueGetter: this.valueGetter(({ data }) => data?.$dungeon?.DisplayName),
          valueFormatter: ({ value }) => this.i18n.get(value),
          filter: SelectboxFilter,
        },
        {
          headerName: 'Slash',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Slash')),
          cellRenderer: this.cellRendererDamage(),
        },
        {
          headerName: 'Thrust',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Thrust')),
          cellRenderer: this.cellRendererDamage(),
        },
        {
          headerName: 'Strike',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Strike')),
          cellRenderer: this.cellRendererDamage(),
        },
        {
          headerName: 'Fire',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Fire')),
          cellRenderer: this.cellRendererDamage(),
        },
        {
          headerName: 'Ice',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Ice')),
          cellRenderer: this.cellRendererDamage(),
        },
        {
          headerName: 'Nature',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Nature')),
          cellRenderer: this.cellRendererDamage(),
        },
        {
          headerName: 'Void',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Corruption')),
          cellRenderer: this.cellRendererDamage(),
        },
        {
          headerName: 'Lighting',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Lightning')),
          cellRenderer: this.cellRendererDamage(),
        },
        {
          headerName: 'Arcane',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Arcane')),
          cellRenderer: this.cellRendererDamage(),
        },
      ],
    }
  }

  public entities: Observable<Entity[]> = defer(() =>
    combineLatest({
      vitals: this.db.vitals,
      dungeons: this.db.gameModes,
    })
  )
    .pipe(
      map(({ vitals, dungeons }) => {
        return vitals.map((vital) => {
          return {
            ...vital,
            $dungeon: getVitalDungeon(vital, dungeons),
          }
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService, private i18n: TranslateService, private vitals: NwVitalsService) {
    super()
  }

  public cellRendererDamage() {
    return this.mithrilCell({
      view: ({ attrs }) => {
        if (!attrs.value) {
          return null
        }
        return m('div.flex.flex-row.items-center.justify-center.relative', [
          m('img.w-8.h-8.mr-1', {
            src: attrs.value < 0 ? this.vitals.iconWeakattack : this.vitals.iconStronattack,
          }),
          m('span.font-bold', `${attrs.value > 0 ? '+' : ''}${attrs.value}%`),
        ])
      },
    })
  }
}
