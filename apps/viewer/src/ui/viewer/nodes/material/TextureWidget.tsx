import type { Texture } from '@gglib/graphics'
import { Show } from 'solid-js'
import { Divider, Flex, Image, TextInput, Widget } from 'tweak-ui'
import { ModalDialog } from '../../../common/ModalDialog'
import { createTextureWidgetStore } from './TextureWidget.store'
import './TextureWidget.css'

/**
 * A texture thumbnail with size and format. A click on the thumbnail shows the texture in a dialog.
 */
export function TextureWidget(props: { label: string; texture: Texture }) {
  const store = createTextureWidgetStore(props)
  return (
    <>
      <Widget label={props.label}>
        <Flex row class="nw-texture-widget">
          <button type="button" title="Show texture" class="nw-texture-thumb" onClick={store.open}>
            <Image src={store.thumbnail()} width={64} aspect={1} />
          </button>
          <Flex>
            <TextInput readonly value={store.state.size} />
            <TextInput readonly value={store.state.format} />
            <TextInput
              readonly
              value={store.state.megabytes}
              slotAfter={<span class="nw-muted">MB (estimated)</span>}
            />
          </Flex>
        </Flex>
      </Widget>
      <ModalDialog title="Texture" open={store.state.open} onClose={store.close}>
        <Show when={store.image()}>
          {(image) => (
            <Flex class="nw-texture-dialog-body">
              <Image class="twk-bg-checker" aspect={1} fit="contain" width="100%" src={image()} />
              <Flex row class="nw-texture-facts">
                <TextureFact label="SIZE" value={store.state.size} />
                <Divider vertical />
                <TextureFact label="FORMAT" value={store.state.format} />
                <Divider vertical />
                <TextureFact label="MIP LEVELS" value={store.state.mipLevels} />
              </Flex>
            </Flex>
          )}
        </Show>
      </ModalDialog>
    </>
  )
}

function TextureFact(props: { label: string; value: string | number }) {
  return (
    <div>
      <div class="nw-muted">{props.label}</div>
      <div>{props.value}</div>
    </div>
  )
}
