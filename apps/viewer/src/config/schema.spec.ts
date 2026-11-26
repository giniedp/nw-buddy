import { describe, expect, it } from 'vitest'
import { viewerConfigSchema } from './schema'

describe('viewerConfigSchema availability', () => {
  const available = (name: keyof typeof viewerConfigSchema, values: Record<string, unknown>) => {
    const rule = viewerConfigSchema[name].available
    return !rule || rule(values)
  }

  it('shows the scale with the window resolution, the framing with a fixed one', () => {
    expect(available('renderScale', { renderResolution: 'window' })).toBe(true)
    expect(available('renderScaling', { renderResolution: 'window' })).toBe(false)
    expect(available('renderScale', { renderResolution: '1920x1080' })).toBe(false)
    expect(available('renderScaling', { renderResolution: '1920x1080' })).toBe(true)
  })

  it('shows the upscaler only while the image is upscaled', () => {
    expect(available('upscaler', { renderResolution: 'window', renderScale: 'native' })).toBe(false)
    expect(available('upscaler', { renderResolution: 'window', renderScale: '67%' })).toBe(true)
    expect(available('upscaler', { renderResolution: '1920x1080', renderScaling: 'fit' })).toBe(true)
    expect(available('upscaler', { renderResolution: '1920x1080', renderScaling: 'none' })).toBe(false)
  })

  it('shows the sharpness only for fsr1', () => {
    const upscaled = { renderResolution: 'window', renderScale: '67%' }
    expect(available('upscaleSharpness', { ...upscaled, upscaler: 'fsr1' })).toBe(true)
    expect(available('upscaleSharpness', { ...upscaled, upscaler: 'bicubic' })).toBe(false)
    expect(available('upscaleSharpness', { renderResolution: 'window', renderScale: 'native', upscaler: 'fsr1' })).toBe(
      false,
    )
  })
})
