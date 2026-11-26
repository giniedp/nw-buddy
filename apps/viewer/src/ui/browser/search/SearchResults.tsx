import { Show } from 'solid-js'
import { Icon, Tree } from 'tweak-ui'
import type { ListFile } from '../../../api/browse'
import { useApp } from '../../app/ViewerApp'
import { typeIcon } from '../assetTypes'
import { createSearchResultsStore, folderOf, type SearchResultsProps } from './SearchResults.store'

/**
 * The files whose path contains the query, or whose asset id is the query, as a flat list with their paths
 */
export function SearchResults(props: SearchResultsProps) {
  const store = createSearchResultsStore(props)
  const { state } = store
  const types = useApp().assetTypes.list()

  return (
    <>
      <p class="nw-note nw-search-summary">{state.summary}</p>
      <Show when={store.files().length}>
        <Tree<ListFile>
          class="nw-asset-tree"
          items={store.files()}
          getId={(file) => file.path}
          // the name first: a narrow sidebar cuts the end of the label, the folder matters less
          getLabel={(file) => (
            <>
              <span classList={{ 'nw-muted': !file.inCatalog }}>{file.name}</span>{' '}
              <span class="nw-muted">{folderOf(file.path)}</span>
            </>
          )}
          getIcon={(file) => <Icon svg={typeIcon(types()[file.type])} />}
          selected={props.selected}
          onSelect={(file) => props.onSelect?.(file)}
          onActivate={(file) => props.onOpen?.(file)}
        />
      </Show>
    </>
  )
}
