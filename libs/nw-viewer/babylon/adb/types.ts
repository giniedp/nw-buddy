import { Animation, AnimationGroup } from '@babylonjs/core'

export interface AnimationFile {
  name: string
  file: string
}

export interface AdbAction {
  name: string
  tags: string[]
  fragments: AdbFragment[]
  valid: boolean
}

export interface AdbFragment {
  tags: string[]
  animLayers: AnimationLayer[]
  procLayers: ProceduralLayer[]

  currentTime?: number
}

export interface AnimationLayer {
  id: number
  sequence: AnimationBar[]

  duration?: number
  start?: () => void
  stop?: () => void
  goTo?: (position: number) => void
}

export interface AnimationBar {
  id: number
  time: number

  name: string
  file: string
  loop: boolean
  speed: number
  startAt: number // animation start time

  animation?: AnimationGroup
}

export interface ProceduralLayer {
  sequence: ProceduralBar[]
  duration?: number
}

export interface ProceduralBar {
  id: number
  time: number

  type: string
  contextType: string
  params: any

  duration?: number
  basis?: number
}

export interface AdbPlayerState {
  playing: boolean
  progress: number
  time: number
  duration: number
}
