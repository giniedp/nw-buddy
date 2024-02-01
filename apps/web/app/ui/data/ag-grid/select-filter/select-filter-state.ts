import m from 'mithril'
import { svgEquals, svgNotEqual, svgTrashCan } from '~/ui/icons/svg'

export interface SelectFilterOption {
  id: string
  label: string
  icon?: string
  negate?: boolean
}

export interface SelectFilterStateAttrs {
  items: SelectFilterOption[]
  onClear: () => void
  onRemove: (id: string) => void
  onToggleComparator: (id: string) => void
}

export const SelectFilterState: m.Component<SelectFilterStateAttrs, any> = {
  view: ({ attrs: { items, onClear, onRemove, onToggleComparator } }) => {
    if (!items?.length) {
      return null
    }
    return [
      m(`ul.menu.menu-compact.p-0.rounded-md.flex-nowrap.flex-1`, [
        m.fragment(
          {},
          items.map((option) => {
            return m(OptionListItem, {
              item: option,
              onRemove,
              onToggleComparator,
            })
          })
        ),
      ]),
    ]
  },
}

const OptionListItem: m.Component<
  { item: SelectFilterOption } & Pick<SelectFilterStateAttrs, 'onToggleComparator' | 'onRemove'>
> = {
  view: ({ attrs: { item, onToggleComparator, onRemove } }) => {
    return m('li.join.flex.flex-row', [
      m(
        'button.join-item.btn.btn-sm',
        {
          onclick: () => onToggleComparator(item.id),
        },
        m('i.aspect-square.w-4.h-4', [m.trust(item.negate ? svgNotEqual : svgEquals)])
      ),
      m('span.join-item.leading-none.flex-1.rounded-none', [
        item.icon && m('img.w-6.h-6', { src: item.icon }),
        m.trust(item.label || '-- empty --'),
      ]),
      m(
        'button.join-item.btn.btn-sm',
        {
          onclick: () => onRemove(item.id),
        },
        m('i.w-4.h-4.flex.items-center', m.trust(svgTrashCan))
      ),
    ])
  },
}
