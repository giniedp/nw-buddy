import { A, type AnchorProps } from '@solidjs/router'
import { mergeProps, splitProps } from 'solid-js'

export type LinkProps = Omit<AnchorProps, 'onClick'> & {
  /**
   * The link shows the current page (e.g. the shown tool): a click stays, a middle or Ctrl click still opens a tab
   */
  current?: boolean
}

/**
 * The router's `A` with class names of the app for its active state. `A` defaults to `active` and `inactive`, which
 * collide with the host page's classes in nw-buddy (daisyUI). The router opens the link in place, a middle or Ctrl
 * click opens it in a new tab.
 *
 * A click on a link to the page that is shown does nothing. The router would add a history entry for it in nw-buddy:
 * it compares the history state too, and Angular adds its own to every entry.
 *
 * @remarks
 * `href` is relative to the router base: the app runs at the root of the origin standalone and at `/pak` in nw-buddy,
 * `A` adds the base (see ui/app/urls.ts). Never build an href with the base by hand.
 */
export function Link(props: LinkProps) {
  const [local, rest] = splitProps(props, ['current'])
  const onClick = (e: MouseEvent & { currentTarget: HTMLAnchorElement }) => {
    if (e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
      return
    }
    if (local.current || isShown(e.currentTarget)) {
      e.preventDefault()
    }
  }
  // a listener on the element (`on:`, not the delegated `onClick`): it runs before the router's on the document
  return (
    <A {...mergeProps({ activeClass: 'nw-link-route', inactiveClass: 'nw-link-other' }, rest)} on:click={onClick} />
  )
}

function isShown(link: HTMLAnchorElement) {
  const url = new URL(link.href)
  return url.pathname === window.location.pathname && url.search === window.location.search
}
