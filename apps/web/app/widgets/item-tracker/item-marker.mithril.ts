import m, { ClosureComponent } from 'mithril'
import { combineLatest, distinctUntilChanged, of, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { CharacterStore } from '~/data'

export interface ItemMarkerAtts {
  itemId: string
  char: CharacterStore
  class?: string
  disabled?: boolean
}

export const ItemMarkerCell: ClosureComponent<ItemMarkerAtts> = () => {
  const itemId$ = new ReplaySubject<string>(1)
  const destroy$ = new Subject()

  let trackedId: string
  let trackedValue: number = 0

  function value(index: number) {
    return Math.pow(2, index)
  }
  function toggle(index: number, char: CharacterStore) {
    let result = trackedValue
    if (checked(index)) {
      result = result & ~value(index)
    } else {
      result = result | value(index)
    }
    char.setItemMarker(trackedId, result)
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
        .pipe(
          switchMap((id) => {
            return combineLatest({
              id: of(id),
              mark: attrs.char.observeItemMarker(id),
            })
          }),
        )
        .pipe(takeUntil(destroy$))
        .subscribe((data) => {
          trackedId = data.id
          trackedValue = cleanValue(data.mark) || 0
          m.redraw()
        })
    },
    onremove: () => {
      destroy$.next(null)
      destroy$.complete()
    },
    view: ({ attrs }) => {
      return m(
        'div.flex.flex-row.h-full.items-center',
        {},
        ['bg-orange-400', 'bg-yellow-400', 'bg-green-400'].map((bgClass, i) => {
          const isChecked = checked(i)
          if (!isChecked && attrs.disabled) {
            return null
          }
          return m('div.w-4.h-4.mask.mask-star-2.transition-all.scale-100', {
            class: [
              bgClass,
              isChecked ? '' : 'opacity-25',
              attrs.disabled ? '' : 'hover:scale-125',
              attrs.disabled ? '' : 'cursor-pointer',
            ].join(' '),
            onclick: () => {
              if (!attrs.disabled) {
                toggle(0, attrs.char)
              }
            },
          })
        }),
      )
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
