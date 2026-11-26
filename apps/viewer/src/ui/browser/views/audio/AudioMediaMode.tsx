import { createEffect, onCleanup, onMount } from 'solid-js'
import { Button } from 'tweak-ui'
import type { AssetViewProps } from '../registry'
import { createAudioMediaModeStore } from './AudioMediaMode.store'
import { drawWaveform } from './waveform'
import './AudioMediaMode.css'

/**
 * A `.wem` media file: plays it (decoded with vgmstream), its format and its waveform
 */
export default function AudioMediaMode(props: AssetViewProps) {
  const store = createAudioMediaModeStore(props)
  const { state } = store
  let canvas!: HTMLCanvasElement

  const draw = () => {
    const buffer = store.clip()
    if (buffer && canvas) {
      drawWaveform(canvas, buffer, state.progress)
    }
  }
  createEffect(draw)
  onMount(() => {
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    onCleanup(() => observer.disconnect())
  })

  return (
    <div class="nw-audio">
      <div class="nw-view-bar">
        <Button ghost disabled={!state.ready} onClick={store.toggle}>
          {state.playing ? 'Stop' : 'Play'}
        </Button>
        <span class="nw-view-info">{state.info}</span>
      </div>
      <canvas class="nw-audio-wave" ref={canvas} />
    </div>
  )
}
