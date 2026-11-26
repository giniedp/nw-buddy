import { For, Show } from 'solid-js'
import { Group, Icon, TextWidget } from 'tweak-ui'
import { browserHref } from '../../../app/urls'
import { ExportButton } from '../../../common/export/ExportButton'
import { LinkButton } from '../../../common/LinkButton'
import svgFolderTree from '../../../icons/folder-tree.svg?raw'
import type { SourceFile } from './types'

/**
 * The game files of an entity, each with "Reveal in browser", which opens the file as a tab of the browser tool, and
 * the export
 */
export function SourceFiles(props: { files: SourceFile[] }) {
  return (
    <Show when={props.files.length}>
      <Group title="Files">
        <For each={props.files}>
          {(file) => (
            <TextWidget
              label={file.label}
              value={file.path}
              readonly
              slotAfter={
                <>
                  <LinkButton
                    ghost
                    href={browserHref(file.path)}
                    title="Reveal in browser: open the file as a tab of the browser tool"
                    icon={<Icon svg={svgFolderTree} />}
                  />
                  <ExportButton ghost square path={file.path} material={file.material} />
                </>
              }
            />
          )}
        </For>
      </Group>
    </Show>
  )
}
