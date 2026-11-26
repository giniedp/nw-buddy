import { Icon, Tree } from 'tweak-ui'
import { useApp } from '../../app/ViewerApp'
import svgFolderOpen from '../../icons/folder-open.svg?raw'
import svgFolder from '../../icons/folder.svg?raw'
import { typeIcon } from '../assetTypes'
import { createAssetTreeStore, type AssetTreeProps } from './AssetTree.store'
import type { TreeNode } from './types'

/**
 * The archive as a tree of folders. Folders load when they are expanded. Double clicking a file opens it.
 */
export function AssetTree(props: AssetTreeProps) {
  const store = createAssetTreeStore(props)
  const { state } = store
  const types = useApp().assetTypes.list()

  const icon = (node: TreeNode, open: boolean) => {
    if (node.kind === 'note') {
      return null
    }
    if (node.kind === 'dir') {
      return <Icon svg={open ? svgFolderOpen : svgFolder} />
    }
    return <Icon svg={typeIcon(types()[node.file.type])} />
  }

  return (
    <Tree<TreeNode>
      class="nw-asset-tree"
      items={store.roots()}
      version={state.version}
      getId={(node) => node.id}
      getLabel={(node) => (
        <span classList={{ 'nw-muted': node.kind === 'note' || (node.kind === 'file' && !node.file.inCatalog) }}>
          {node.name}
        </span>
      )}
      getIcon={icon}
      getChildren={store.childrenOf}
      expanded={store.expanded()}
      onExpandedChange={store.setExpanded}
      selected={props.selected}
      onSelect={store.select}
      onActivate={store.activate}
    />
  )
}
