import m from 'mithril'

export interface IconComponentAttrs {
  src: string
  class: string
}
export const IconComponent: m.ClosureComponent<IconComponentAttrs> = () => {
  let hasError = false
  let didLoad = false
  function onError() {
    hasError = true
  }
  function onSuccess() {
    didLoad = true
  }
  return {
    view: ({ attrs }) => {
      return m(
        'picture',
        {
          class: attrs.class,
        },
        [
          m('img.fade', {
            src: attrs.src,
            class: [hasError ? 'error' : didLoad ? 'show' : ''].join(' '),
            onerror: onError,
            onload: onSuccess,
          }),
        ]
      )
    },
  }
}
