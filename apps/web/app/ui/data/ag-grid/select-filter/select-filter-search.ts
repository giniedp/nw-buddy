import m from 'mithril'

interface SelectFilterSearchAttrs {
  show: boolean
  value: string
  onchange: (value: string) => void
}

export const SelectFilterSearch: m.Component<SelectFilterSearchAttrs> = {
  view: ({ attrs: { value, onchange, show } }) => {
    if (!show) {
      return null
    }
    return m('div.fomr-control', [
      m('div.input-group.input-group-xs', [
        m('input.input.input-bordered.input-xs.w-full', {
          type: 'text',
          placeholder: 'search',
          value: value,
          oninput: (e: InputEvent) => {
            onchange((e.target as HTMLInputElement).value)
          },
        }),
        m(
          'button.btn.btn-ghost.btn-xs',
          {
            onclick: () => onchange(''),
          },
          [m.trust(value ? svgActive : svgInactive)]
        ),
      ]),
    ])
  },
}

const svgActive =
  '<svg class="h-4 w-4" viewBox="0 0 320 512" fill="currentColor" stroke="currentColor"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg>'
const svgInactive =
  '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>'
