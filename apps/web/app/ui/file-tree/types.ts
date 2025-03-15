
export interface TreeNode<T> {
  name: string
  icon?: string
  folders: TreeNode<T>[],
  files: TreeLeaf<T>[]
}

export interface TreeLeaf<T> {
  id: string
  name: string
  icon?: string
  data: T
}
