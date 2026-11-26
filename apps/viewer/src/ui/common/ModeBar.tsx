import { For, type JSX } from 'solid-js'
import { Button, ButtonGroup } from 'tweak-ui'

/**
 * The display modes of a document as a segmented control, with room for the tools of the mode on the right
 */
export function ModeBar(props: {
  modes: Array<{ id: string; label: string; title?: string }>
  active: string | undefined
  onSelect: (id: string) => void
  tools?: JSX.Element
}) {
  return (
    <div class="nw-mode-bar">
      <ButtonGroup>
        <For each={props.modes}>
          {(mode) => (
            <Button active={mode.id === props.active} title={mode.title} onClick={() => props.onSelect(mode.id)}>
              {mode.label}
            </Button>
          )}
        </For>
      </ButtonGroup>
      <div class="nw-mode-tools">{props.tools}</div>
    </div>
  )
}
