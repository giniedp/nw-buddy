import { describe, expect, it } from 'vitest'
import { waveformPeaks } from './waveform'

describe('waveformPeaks', () => {
  it('takes min and max of every column over all channels', () => {
    const buffer = new AudioBuffer({ length: 4, numberOfChannels: 2, sampleRate: 8000 })
    buffer.copyToChannel(new Float32Array([0.5, -0.25, 0.25, 0]), 0)
    buffer.copyToChannel(new Float32Array([0, 0, -0.5, 0.75]), 1)
    expect([...waveformPeaks(buffer, 2)]).toEqual([-0.25, 0.5, -0.5, 0.75])
  })

  it('keeps zero in the range of a silent or one sided column', () => {
    const buffer = new AudioBuffer({ length: 2, numberOfChannels: 1, sampleRate: 8000 })
    buffer.copyToChannel(new Float32Array([0.5, 0.25]), 0)
    expect([...waveformPeaks(buffer, 1)]).toEqual([0, 0.5])
  })
})
