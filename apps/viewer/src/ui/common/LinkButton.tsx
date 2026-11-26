import type { JSX } from 'solid-js'
import { Link, type LinkProps } from './Link'

/**
 * A {@link Link} that looks like a tweak-ui `Button` (its `twk-btn` classes and `data-active`)
 */
export function LinkButton(props: {
  /**
   * Relative to the router base, see {@link Link}
   */
  href: string
  /**
   * Replaces the history entry instead of adding one
   */
  replace?: boolean
  title?: string
  /**
   * An icon before the content, e.g. an `Icon`
   */
  icon?: JSX.Element
  ghost?: boolean
  square?: boolean
  /**
   * Shows the button as pressed, e.g. the shown tool. The router's own active state compares paths, the caller
   * decides what is pressed.
   */
  active?: boolean
  /**
   * The link shows the current page, see {@link LinkProps.current}
   */
  current?: boolean
  class?: string
  children?: JSX.Element
}) {
  return (
    <Link
      href={props.href}
      current={props.current}
      // the router reads the attribute: present means replace, whatever its value
      replace={props.replace || undefined}
      title={props.title}
      class={props.class ? `twk-btn nw-link-btn ${props.class}` : 'twk-btn nw-link-btn'}
      classList={{ 'twk-btn-ghost': !!props.ghost, 'twk-btn-square': !!props.square }}
      data-active={props.active ? '' : undefined}
    >
      {props.icon != null ? <span class="twk-btn-icon">{props.icon}</span> : null}
      {props.children}
    </Link>
  )
}
