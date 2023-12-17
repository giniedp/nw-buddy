import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { GatherableNodeSize, getGatherableNodeSize } from '@nw-data/common'
import { Spawns } from '@nw-data/generated'
import { BehaviorSubject, combineLatest, map, of, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwModule } from '~/nw'
import { combineLatestOrEmpty, mapFilter, selectStream } from '~/utils'
import { LandMapComponent, Landmark } from '~/widgets/land-map'
import { GatherableDetailStore } from './gatherable-detail.store'
import { TooltipModule } from '~/ui/tooltip'

const SIZE_COLORS: Record<GatherableNodeSize, string> = {
  Tiny: '#f28c18',
  Small: '#51A800',
  Medium: '#2563EB',
  Large: '#DC2626',
  Huge: '#6D3A9C',
}
const SIZE_OUTLINE: Record<GatherableNodeSize, string> = {
  Tiny: '#653806',
  Small: '#204300',
  Medium: '#092564',
  Large: '#590e0e',
  Huge: '#2c173e',
}

const SIZE_LABELS: Record<GatherableNodeSize, string> = {
  Tiny: 'XS',
  Small: 'S',
  Medium: 'M',
  Large: 'L',
  Huge: 'XL',
}
const SIZE_RADIUS: Record<GatherableNodeSize, number> = {
  Tiny: 6,
  Small: 7,
  Medium: 8,
  Large: 9,
  Huge: 10,
}
const SIZE_ORDER = ['Tiny', 'Small', 'Medium', 'Large', 'Huge']

@Component({
  standalone: true,
  selector: 'nwb-gatherable-detail-map',
  templateUrl: './gatherable-detail-map.component.html',
  imports: [NwModule, LandMapComponent, TooltipModule],
  host: {
    class: 'block rounded-md overflow-clip relative',
    '[hidden]': '!hasMap()',
  },
})
export class GatherableDetailMapComponent {
  protected db = inject(NwDbService)
  protected store = inject(GatherableDetailStore)
  protected tl8 = inject(TranslateService)

  protected data$ = selectStream(
    this.store.siblings$
      .pipe(map((list) => list || []))
      .pipe(
        switchMap((list) => {
          return combineLatestOrEmpty(
            list.map((it) =>
              combineLatest({
                gatherable: of(it),
                meta: this.db.gatherablesMeta(it.GatherableID),
                variations: this.db.gatherableVariationsByGatherableId(it.GatherableID).pipe(
                  map((list) => (list ? Array.from(list.values()) : [])),
                  switchMap((list) => combineLatestOrEmpty(list.map((it) => this.db.variationsMeta(it.VariantID)))),
                  mapFilter((it) => !!it),
                ),
              }),
            ),
          )
        }),
      )
      .pipe(
        map((list) => {
          const result: Record<string, Record<string, Landmark[]>> = {}
          for (const { gatherable, meta, variations } of list) {
            const size = getGatherableNodeSize(gatherable.GatherableID) || ('_' as GatherableNodeSize)
            const name = this.tl8.get(gatherable.DisplayName) + (size ? ` - ${size}` : '')
            for (const mapId of meta?.mapIDs || []) {
              for (const spawn of meta.spawns[mapId as keyof Spawns] || []) {
                result[mapId] ??= {}
                result[mapId][size] ??= []
                result[mapId][size].push({
                  title: `${name}<br/>x:${spawn[0].toFixed(2)} y:${spawn[1].toFixed(2)}`,
                  color: SIZE_COLORS[size] || SIZE_COLORS.Medium,
                  outlineColor: SIZE_OUTLINE[size] || SIZE_OUTLINE.Medium,
                  point: spawn,
                  radius: SIZE_RADIUS[size] || SIZE_RADIUS.Medium,
                })
              }
            }
            for (const { mapIDs, spawns } of variations || []) {
              for (const mapId of mapIDs || []) {
                for (const spawn of spawns[mapId as keyof Spawns] || []) {
                  result[mapId] ??= {}
                  result[mapId][size] ??= []
                  result[mapId][size].push({
                    title: `${name}<br/>x:${spawn[0].toFixed(2)} y:${spawn[1].toFixed(2)}`,
                    color: SIZE_COLORS[size],
                    outlineColor: SIZE_OUTLINE[size] || SIZE_OUTLINE.Medium,
                    point: spawn,
                    radius: SIZE_RADIUS[size] || SIZE_RADIUS.Medium,

                  })
                }
              }
            }
          }
          for (const mapId in result) {
            for (const size in result[mapId]) {
              {
                result[mapId][size].sort((a, b) => b.radius - a.radius)
              }
            }
          }
          return result
        }),
      ),
  )

  protected mapIds$ = selectStream(this.data$, (it) => Object.keys(it || {}))
  protected fallbackMapId$ = selectStream(this.mapIds$, (it) => it?.[0])
  protected selectedMapId$ = new BehaviorSubject<string>(null)
  protected mapId$ = selectStream(
    {
      selected: this.selectedMapId$,
      fallback: this.fallbackMapId$,
      mapIds: this.mapIds$,
    },
    ({ selected, fallback, mapIds }) => {
      let result = selected ?? fallback
      if (result && !mapIds.includes(result)) {
        result = fallback
      }
      return result
    },
  )

  protected availableSizes$ = selectStream(
    {
      data: this.data$,
      mapId: this.mapId$,
    },
    ({ data, mapId }) => {
      if (!data || !mapId || !data[mapId]) {
        return []
      }
      const sizes = Object.keys(data[mapId])
      if (sizes.length <= 1) {
        return []
      }

      return sizes
        .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b))
        .map((size) => {
          return {
            label: SIZE_LABELS[size],
            value: size,
            color: SIZE_COLORS[size],
            count: data[mapId][size].length,
          }
        })
    },
  )

  public readonly landmarks$ = selectStream(
    {
      mapId: this.mapId$,
      data: this.data$,
    },
    ({ mapId, data }) => {
      if (!data || !mapId || !data[mapId]) {
        return []
      }
      return Object.values(data[mapId] || {}).flat()
    },
  )

  public data = toSignal(this.data$)
  public landmarks = toSignal(this.landmarks$)
  public mapId = toSignal(this.mapId$)
  public hasMap = toSignal(selectStream(this.mapIds$, (it) => !!it?.length))
  public sizes = toSignal(this.availableSizes$)
}
