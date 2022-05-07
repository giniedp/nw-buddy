import { ClosureComponent } from 'mithril'
import { distinctUntilChanged, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { ItemPreferencesService } from '~/core/preferences'
import m from 'mithril'

export interface ItemMarkerAtts {
  itemId: string
  meta: ItemPreferencesService
  class?: string
}

export const ItemMarkerCell: ClosureComponent<ItemMarkerAtts> = () => {
  const itemId$ = new ReplaySubject<string>(1)
  const destroy$ = new Subject()

  let trackedId: string
  let trackedValue: number = 0

  function value(index: number) {
    return Math.pow(2, index)
  }
  function toggle(index: number, pref: ItemPreferencesService) {
    let result = trackedValue
    if (checked(index)) {
      result = result & (~value(index))
    } else {
      result = result | value(index)
    }
    pref.merge(trackedId, {
      mark: result
    })
  }

  function checked(index: number) {
    return !!(trackedValue & value(index))
  }
  return {
    onupdate: ({ attrs }) => {
      itemId$.next(attrs.itemId)
    },
    oncreate: ({ attrs }) => {
      itemId$
        .pipe(distinctUntilChanged())
        .pipe(switchMap((id) => attrs.meta.observe(id)))
        .pipe(takeUntil(destroy$))
        .subscribe((data) => {
          trackedId = data.id
          trackedValue = cleanValue(data.meta?.mark) || 0
          m.redraw()
        })
    },
    onremove: () => {
      destroy$.next(null)
      destroy$.complete()
    },
    view: ({ attrs }) => {
      return m('div.flex.flex-row.h-full.items-center', {}, [
        m('div.w-4.h-4.cursor-pointer.mask.mask-star-2.transition-all.scale-100.hover:scale-125', {
          class: [
            'bg-orange-400',
            checked(0) ? '' : 'opacity-25'
          ].join(' '),
          onclick: () => toggle(0, attrs.meta)
        }),
        m('div.w-4.h-4.cursor-pointer.mask.mask-star-2.transition-all.scale-100.hover:scale-125', {
          class: [
            'bg-yellow-400',
            checked(1) ? '' : 'opacity-25'
          ].join(' '),
          onclick: () => toggle(1, attrs.meta)
        }),
        m('div.w-4.h-4.cursor-pointer.mask.mask-star-2.transition-all.scale-100.hover:scale-125', {
          class: [
            'bg-green-400',
            checked(2) ? '' : 'opacity-25'
          ].join(' '),
          onclick: () => toggle(2, attrs.meta)
        }),
      ])
    },
  }
}

function cleanValue(value: string | number | boolean) {
  if (typeof value !== 'number') {
    value = Number(value)
  }
  if (Number.isFinite(value)) {
    return value
  }
  return null
}
