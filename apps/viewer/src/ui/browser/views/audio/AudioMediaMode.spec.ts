import { describe, expect, it } from 'vitest'
import { mediaInfo } from './AudioMediaMode.store'
import { formatDuration } from './playback'

describe('mediaInfo', () => {
  it('formats seconds as m:ss.s', () => {
    expect(formatDuration(0)).toBe('0:00.0')
    expect(formatDuration(5.25)).toBe('0:05.3')
    expect(formatDuration(83.4)).toBe('1:23.4')
  })

  it('tells position, duration and format of a clip', () => {
    expect(mediaInfo(1.5, { duration: 10, numberOfChannels: 2, sampleRate: 48000 })).toBe(
      '0:01.5 / 0:10.0 · 2 ch · 48000 Hz',
    )
  })
})
