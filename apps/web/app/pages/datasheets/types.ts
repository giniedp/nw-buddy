export interface TreeNode {
  name: string
  folders: TreeNode[]
  files: Datasheet[]
}

export interface Datasheet {
  id: string
  url: string
  type: string
  name: string
  filename: string
  content: string
  error?: any
}

export interface Tab {
  id: string
  label: string
  file: Datasheet
}
