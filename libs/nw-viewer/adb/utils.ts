import { AdbFragment, AdbPlayerState, AnimationBar, AnimationLayer } from './types'

export function getFragmentState(fragment: AdbFragment): AdbPlayerState {
  if (!fragment) {
    return null
  }
  const layer = fragment.animLayers[0]
  let seconds = 0
  let isPlaying = false
  for (const seq of layer.sequence) {
    seconds += seq.time
    const animation = seq.animation
    if (!animation?.isPlaying) {
      continue
    }
    isPlaying = true
    const fps = animation.targetedAnimations[0].animation.framePerSecond * animation.speedRatio
    const frames = animation.getCurrentFrame() - animation.from
    seconds += frames / fps
    break
  }
  if (isPlaying) {
    fragment.currentTime = seconds
  } else {
    seconds = fragment.currentTime || 0
  }
  const progress = seconds / layer.duration
  return {
    duration: layer.duration,
    time: seconds,
    progress: progress,
    playing: isPlaying,
  }
}

export function goToFragmentTime(fragment: AdbFragment, time: number) {
  fragment.currentTime = time
  for (const layer of fragment.animLayers) {
    layer.goTo(time)
  }
}

export function compileAnimation(layer: AnimationLayer) {
  function run(cmd: AnimationBar) {
    if (cmd) {
      cmd.animation.start(cmd.loop, cmd.speed)
    }
  }

  let duration = 0
  for (let i = 0; i < layer.sequence.length; i++) {
    const cmd = layer.sequence[i]
    const group = layer.sequence[i].animation
    group.enableBlending = true
    group.blendingSpeed = 0.05
    group.speedRatio = cmd.speed

    const fps = group.targetedAnimations[0].animation.framePerSecond * cmd.speed
    group.from = Math.floor(cmd.startAt * fps)

    const next = layer.sequence[i + 1]
    if (next) {
      group.to = Math.floor(group.from + next.time * fps)
      group.onAnimationEndObservable.add(() => run(next))
    }
    duration += group.getLength()
  }

  layer.duration = duration
  layer.goTo = (time: number) => goToTime(layer, time)
  layer.start = () => run(layer.sequence[0])
  layer.stop = () => {
    for (const cmd of layer.sequence) {
      cmd.animation.stop()
    }
  }
}

export function compileProcLayers(fragment: AdbFragment) {
  let maxDuration = 0
  for (const layer of fragment.procLayers) {
    layer.duration = 0
    layer.sequence.forEach((bar, i, list) => {
      bar.duration = list[i + 1]?.time || 0
      layer.duration += bar.duration
    })
    maxDuration = Math.max(maxDuration, layer.duration)
  }
  for (const layer of fragment.animLayers) {
    maxDuration = Math.max(maxDuration, layer.duration || 0)
  }
  if (!maxDuration) {
    maxDuration = 1
  }
  for (const layer of fragment.procLayers) {
    if (!layer.sequence.length) {
      continue
    }
    layer.sequence[layer.sequence.length - 1].duration = maxDuration - layer.duration
    for (const bar of layer.sequence) {
      bar.basis = (bar.duration / maxDuration) * 100
    }
    layer.duration = maxDuration
  }
}

function goToTime(layer: AnimationLayer, time: number) {
  for (const cmd of layer.sequence) {
    cmd.animation.pause()
  }
  for (let i = 0; i < layer.sequence.length; i++) {
    const cmd = layer.sequence[i]
    const next = layer.sequence[i + 1]
    const group = cmd.animation
    time -= cmd.time
    if (time >= 0 && (!next || time < next.time)) {
      const fps = group.targetedAnimations[0].animation.framePerSecond * cmd.speed
      const frame = (cmd.startAt + time) * fps
      cmd.animation.start(false, cmd.speed)
      cmd.animation.goToFrame(frame)
      cmd.animation.pause()
      break
    }
  }
}
