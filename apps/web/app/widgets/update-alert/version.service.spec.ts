import { compareVersions, Release, selectLatestRelease } from './version.service'

describe('compareVersions', () => {
  it('orders by core and prerelease', () => {
    expect(compareVersions('10.0.4-0', '10.0.4-0')).toBe(0)
    expect(compareVersions('10.0.4-0', '10.0.2-0')).toBeGreaterThan(0)
    expect(compareVersions('10.0.2-0', '10.0.4-0')).toBeLessThan(0)
    expect(compareVersions('10.0.4-1', '10.0.4-0')).toBeGreaterThan(0)
    expect(compareVersions('10.0.4', '10.0.4-0')).toBeGreaterThan(0)
    expect(compareVersions('10.0.10-0', '10.0.9-0')).toBeGreaterThan(0)
    expect(compareVersions('5.0.3', '10.0.2-0')).toBeLessThan(0)
  })

  it('ignores the commit hash and the v prefix', () => {
    expect(compareVersions('v10.0.4-0', '10.0.4-0#abc1234')).toBe(0)
  })
})

describe('selectLatestRelease', () => {
  function release(tag: string, options: Partial<Release> = {}): Release {
    return { tag_name: tag, html_url: `https://example.com/${tag}`, draft: false, prerelease: false, ...options }
  }

  it('picks the newest app release including prereleases', () => {
    const result = selectLatestRelease([
      release('nwbt-v0.0.2'),
      release('v10.0.2-0', { prerelease: true }),
      release('v10.0.5-0', { draft: true }),
      release('v5.0.3'),
    ])
    expect(result).toEqual({ version: '10.0.2-0', url: 'https://example.com/v10.0.2-0' })
  })
})
