import type { IVec4 } from '@gglib/math'

export interface NwViewerCommand {
  type: 'nw_viewer_command'
  action: string
}

export function isViewerCommand(data: unknown): data is NwViewerCommand {
  return (data as NwViewerCommand)?.type === 'nw_viewer_command'
}

export interface NwViewerLoadModelCommand extends NwViewerCommand {
  action: 'load_model'
  model: string
  material?: string
  transform?: number[]
}

export function isLoadModelCommand(command: NwViewerCommand): command is NwViewerLoadModelCommand {
  return (command as NwViewerCommand).action === 'load_model'
}

export interface NwViewerLoadSliceCommand extends NwViewerCommand {
  action: 'load_slice'
  slice: string
  deep?: boolean
}

export function isLoadSliceCommand(command: NwViewerCommand): command is NwViewerLoadSliceCommand {
  return (command as NwViewerCommand).action === 'load_slice'
}

export interface NwViewerLoadLevelCommand extends NwViewerCommand {
  action: 'load_level'
  level: string
  spawn: IVec4
}

export function isLoadLevelCommand(command: NwViewerCommand): command is NwViewerLoadLevelCommand {
  return (command as NwViewerCommand).action === 'load_level'
}

export interface NwViewerTeleportCommand extends NwViewerCommand {
  action: 'teleport'
  position: IVec4
}

export function isTeleportCommand(command: NwViewerCommand): command is NwViewerTeleportCommand {
  return (command as NwViewerCommand).action === 'teleport'
}

export interface NwViewerResetCommand extends NwViewerCommand {
  action: 'reset'
}

export function isResetCommand(command: NwViewerCommand): command is NwViewerResetCommand {
  return (command as NwViewerCommand).action === 'reset'
}
