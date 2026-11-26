import { For, Match, Show, Switch } from 'solid-js'
import { Icon } from 'tweak-ui'
import type { SheetColumn } from '../../../api/browse'
import { useApp } from '../../app/ViewerApp'
import { browserHref, dataHref } from '../../app/urls'
import { Link } from '../../common/Link'
import { LinkButton } from '../../common/LinkButton'
import svgOpen from '../../icons/arrow-up-right-from-square.svg?raw'
import { cellItems, type RowRef } from '../families'
import { locElement } from '../locMarkup'
import { partTrigger, sheetFilePath, songBankPath, songField } from '../songs'
import { AudioButton } from './AudioButton'
import { createFoundFile, createRefTargets, createSongTrigger } from './FieldValue.store'

/**
 * The value of a field by what its column holds: references, localized texts, files, audio, the fields of songs
 */
export function FieldValue(props: { column: SheetColumn; text: string; from: RowRef }) {
  const app = useApp()
  const song = () => songField(props.from.family, props.column.name)
  return (
    <Switch fallback={<span class="nw-data-text">{props.text}</span>}>
      <Match when={song() === 'sheet-audio'}>
        <AudioButton trigger={partTrigger(props.text)} label={props.text} />
      </Match>
      <Match when={song() === 'song-slot'}>
        <SongSlot column={props.column} value={props.text} from={props.from} />
      </Match>
      <Match when={song() === 'song-bank'}>
        <BrowserFileLink path={songBankPath(props.text)} text={props.text} />
      </Match>
      <Match when={song() === 'sheet-file'}>
        <BrowserFileLink path={sheetFilePath(props.text)} text={props.text} />
      </Match>
      <Match when={props.column.kind === 'ref'}>
        <span class="nw-data-items">
          <For each={cellItems(props.text)}>
            {(key) => <RefLink column={props.column} value={key} from={props.from} />}
          </For>
        </span>
      </Match>
      <Match when={props.column.kind === 'key'}>
        <span class="nw-data-items">
          <For each={cellItems(props.text)}>{(key) => <span class="nw-data-text">{key}</span>}</For>
        </span>
      </Match>
      <Match when={props.column.kind === 'loc'}>
        <span class="nw-data-text" title={props.text}>
          {locElement(app.nwbt, app.loc.text(props.text) ?? props.text)}
        </span>
      </Match>
      <Match when={props.column.kind === 'asset'}>
        <span class="nw-data-items">
          <For each={cellItems(props.text)}>{(path) => <AssetLink path={path} />}</For>
        </span>
      </Match>
      <Match when={props.column.kind === 'audio'}>
        <span class="nw-data-items">
          <For each={cellItems(props.text)}>{(name) => <AudioButton trigger={name} />}</For>
        </span>
      </Match>
    </Switch>
  )
}

/**
 * A key of another family: a link to the row of the best matching family that has it, and small links to the other
 * families that have it too. Plain text when none has it.
 */
function RefLink(props: { column: SheetColumn; value: string; from: RowRef }) {
  const store = createRefTargets(props)
  const link = (target: RowRef, text: string, extra: boolean) => (
    <Link
      class="nw-data-link"
      classList={{ 'nw-data-link-alt': extra }}
      href={dataHref(target.family, target.key)}
      // a reference opens a kept tab, the row type list the temporary one (DataTool.store syncActiveTabWithUrl)
      state={{ keep: true }}
      title={`${target.family}: ${target.key}`}
    >
      {text}
    </Link>
  )
  return (
    <Show
      when={store.targets().length}
      fallback={
        <span
          class="nw-data-text"
          classList={{ 'nw-data-dead': store.dead() }}
          title={store.dead() ? `No row of ${props.column.refs?.join(', ')} has this key` : undefined}
        >
          {props.value}
        </span>
      }
    >
      <span class="nw-data-ref">
        {link(store.targets()[0], props.value, false)}
        <For each={store.targets().slice(1)}>{(target) => link(target, target.family, true)}</For>
      </span>
    </Show>
  )
}

/**
 * A sheet of a song: the link to the sheet with a play button for its instrument part (songs.ts)
 */
function SongSlot(props: { column: SheetColumn; value: string; from: RowRef }) {
  const store = createSongTrigger(props)
  const link = () => <RefLink column={props.column} value={props.value} from={props.from} />
  return (
    <Show when={store.trigger()} fallback={link()}>
      {(it) => <AudioButton trigger={it()} label={link()} />}
    </Show>
  )
}

/**
 * A value that names a file (the bank of a song, the notes of a sheet, songs.ts): the value is a link that opens the
 * file in the browser, plain text when the archive lacks it
 */
function BrowserFileLink(props: { path: string; text: string }) {
  const store = createFoundFile(props)
  return (
    <Show
      when={store.file()}
      fallback={
        <span class="nw-data-text" classList={{ 'nw-data-dead': store.dead() }}>
          {props.text}
        </span>
      }
    >
      {(path) => (
        <Link class="nw-data-link" href={browserHref(path())} title={`Open ${path()} in the browser`}>
          {props.text}
        </Link>
      )}
    </Show>
  )
}

/**
 * A file path: opens the file in the browser, plain text when the archive lacks it
 */
function AssetLink(props: { path: string }) {
  const store = createFoundFile(props)
  return (
    <span class="nw-data-asset">
      <span class="nw-data-text" classList={{ 'nw-data-dead': store.dead() }}>
        {props.path}
      </span>
      <Show when={store.file()}>
        {(it) => (
          <LinkButton
            ghost
            square
            href={browserHref(it())}
            title={`Open ${it()} in the browser`}
            icon={<Icon svg={svgOpen} />}
          />
        )}
      </Show>
    </span>
  )
}
