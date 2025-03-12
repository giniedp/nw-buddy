import { EQUIP_SLOTS, getItemIconPath, getWeightLabel, isItemArtifact, isItemNamed } from '@nw-data/common'
import { filter, take } from 'rxjs'
import { GearsetRow } from '~/data'
import { TableGridUtils } from '~/ui/data/table-grid'
import { svgPen, svgTrashCan } from '~/ui/icons/svg'
import { ConfirmDialogComponent } from '~/ui/layout'

export type GearsetTableUtils = TableGridUtils<GearsetTableRecord>
export type GearsetTableRecord = GearsetRow

export function gearsetColName(util: GearsetTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    sortable: true,
    filter: true,
    width: 250,
    valueGetter: ({ data }) => data.record.name,
  })
}

export function gearsetColWeight(util: GearsetTableUtils) {
  return util.colDef<number>({
    colId: 'weight',
    headerValueGetter: () => 'Weight',
    sortable: true,
    filter: true,
    width: 100,
    field: 'weight',
    valueFormatter: ({ value }) => getWeightLabel(value),
    getQuickFilterText: ({ value }) => getWeightLabel(value),
  })
}

export function gearsetColGearScore(util: GearsetTableUtils) {
  return util.colDef<number>({
    colId: 'gearScore',
    headerValueGetter: () => 'GS',
    sortable: true,
    filter: true,
    width: 100,
    field: 'gearScore',
    getQuickFilterText: () => '',
  })
}

export function gearsetColSlots(util: GearsetTableUtils) {
  return util.colDef({
    colId: 'slots',
    headerValueGetter: () => 'Slots',
    sortable: false,
    filter: false,
    autoHeight: true,
    width: 600,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.el(
        'div.flex.flex-row.flex-wrap.gap-1.items-center.h-full.overflow-hidden',
        {},
        EQUIP_SLOTS.map((slot) => {
          const sData = data.slots?.[slot.id]
          if (!sData?.item) {
            return null
          }
          return util.elItemIcon({
            class: ['transition-all translate-x-0 hover:translate-x-1'],
            icon: getItemIconPath(sData.item),
            isArtifact: isItemArtifact(sData.item),
            isNamed: isItemNamed(sData.item),
            rarity: sData.rarity,
          })
        }).filter((it) => !!it),
      )
    }),
  })
}

// export function gearsetColActions(util: GearsetTableUtils) {
//   return util.colDef({
//     colId: 'actions',
//     headerValueGetter: () => 'Actions',
//     sortable: false,
//     filter: false,
//     resizable: false,
//     width: 120,
//     cellRenderer: util.cellRenderer(({ data }) => {
//       return util.el('div.join.content-center', {}, [
//         util.el('button.join-item.btn.btn-ghost', {
//           html: `<span class="w-4 h-4">${svgPen}</span>`,
//           ev: {
//             onclick: (e) => {
//               e.stopImmediatePropagation()
//               util.zone.run(() => {
//                 util.router.navigate([data.record.id], {
//                   relativeTo: util.route,
//                 })
//               })
//             },
//           },
//         }),
//         util.el('button.btn.btn-ghost', {
//           html: `<span class="w-4 h-4">${svgTrashCan}</span>`,
//           ev: {
//             onclick: (e) => {
//               e.stopImmediatePropagation()
//               util.zone.run(() => {
//                 ConfirmDialogComponent.open(util.dialog, {
//                   data: {
//                     title: 'Delete Gearset',
//                     body: 'Are you sure you want to delete this gearset?',
//                     positive: 'Delete',
//                     negative: 'Cancel',
//                   },
//                 })
//                   .closed.pipe(take(1))
//                   .pipe(filter((it) => !!it))
//                   .subscribe(() => {
//                     util.store.destroyRecord({ recordId: data.record.id })
//                   })
//               })
//             },
//           },
//         }),
//       ])
//     }),
//   })
// }
