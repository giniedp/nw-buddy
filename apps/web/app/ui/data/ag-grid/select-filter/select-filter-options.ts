import m from 'mithril'

export interface SelectFilterOption {
  id: string
  label: string
  icon?: string
  active?: boolean
}

export interface SelectFilterListAttrs {
  items: Array<SelectFilterOption>
  onSelect?: (id: SelectFilterOption) => void
}

export const SelectFilterOptions: m.Component<SelectFilterListAttrs, any> = {
  view: ({ attrs: { items, onSelect } }) => {
    if (!items?.length) {
      return null
    }
    return [
      m(`ul.menu.menu-compact.p-0.rounded-md.flex-nowrap.flex-1.overflow-y-auto`, [
        ...items.map((option) => {
          return m('li', [
            m(
              'a.rounded-none',
              {
                class: option.active ? 'bg-primary' : '',
                onclick: () => onSelect(option),
              },
              [
                option.icon &&
                  m('img.w-6.h-6', {
                    src: option.icon,
                  }),
                m.trust(option.label || '-- empty --'),
              ]
            ),
          ])
        }),
      ]),
    ]
  },
}
