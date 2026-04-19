import { describe, it, expect } from 'vitest'
import { resolveAssetUrl, LANDING_VIDEOS } from '../config'

describe('resolveAssetUrl', () => {
  it('returns a /landing-prefixed URL by default', () => {
    expect(resolveAssetUrl('foo.mp4')).toBe('/landing/foo.mp4')
  })

  it('strips leading slashes from the filename', () => {
    expect(resolveAssetUrl('/foo.mp4')).toBe('/landing/foo.mp4')
    expect(resolveAssetUrl('//foo.mp4')).toBe('/landing/foo.mp4')
  })

  it('resolves canonical video filenames', () => {
    expect(resolveAssetUrl(LANDING_VIDEOS.platformOverview)).toBe(
      '/landing/platform-overview.mp4'
    )
    expect(resolveAssetUrl(LANDING_VIDEOS.taskRouter)).toBe('/landing/task-router.mp4')
  })
})
