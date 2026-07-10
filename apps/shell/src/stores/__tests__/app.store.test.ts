import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/query-client', () => ({
  armSchoolTransitionErrorToast: vi.fn(),
}))
vi.mock('@edforge/config/school-context-channel', () => ({
  broadcastSchoolChange: vi.fn(),
  resetSchoolContext: vi.fn(),
}))

import { useAppStore, getSchoolSessionOwner, setSchoolSessionOwner } from '../app.store'
import { armSchoolTransitionErrorToast } from '../../lib/query-client'
import { broadcastSchoolChange } from '@edforge/config/school-context-channel'

function readPersistedCookie(): Record<string, unknown> | null {
  const match = document.cookie.match(/(^| )edforge-app=([^;]+)/)
  if (!match) return null
  const parsed = JSON.parse(decodeURIComponent(match[2]))
  return parsed.state ?? parsed
}

beforeEach(() => {
  document.cookie = 'edforge-app=; path=/; max-age=0'
  sessionStorage.clear()
  useAppStore.setState({
    activeSchoolId: null,
    activeSchoolStatus: null,
    isSchoolTransitioning: false,
  })
  vi.clearAllMocks()
})

describe('setActiveSchoolId', () => {
  it('does not raise the transition flag on first selection', () => {
    useAppStore.getState().setActiveSchoolId('s1')
    expect(useAppStore.getState().activeSchoolId).toBe('s1')
    expect(useAppStore.getState().isSchoolTransitioning).toBe(false)
    expect(broadcastSchoolChange).toHaveBeenCalled()
    expect(armSchoolTransitionErrorToast).not.toHaveBeenCalled()
  })

  it('raises the transition flag and arms the error toast on a real switch', () => {
    useAppStore.getState().setActiveSchoolId('s1')
    useAppStore.getState().setActiveSchoolId('s2')
    expect(useAppStore.getState().isSchoolTransitioning).toBe(true)
    expect(armSchoolTransitionErrorToast).toHaveBeenCalledWith('s2')
  })

  it('silent option sets the school without the transition flag', () => {
    useAppStore.getState().setActiveSchoolId('s1')
    useAppStore.getState().setActiveSchoolId('s2', { silent: true })
    expect(useAppStore.getState().activeSchoolId).toBe('s2')
    expect(useAppStore.getState().isSchoolTransitioning).toBe(false)
    expect(armSchoolTransitionErrorToast).not.toHaveBeenCalled()
  })

  it('is a no-op for the same school id', () => {
    useAppStore.getState().setActiveSchoolId('s1')
    vi.clearAllMocks()
    useAppStore.getState().setActiveSchoolId('s1')
    expect(broadcastSchoolChange).not.toHaveBeenCalled()
  })
})

describe('clearSchoolContext', () => {
  it('resets school state and removes the session marker without broadcasting', () => {
    setSchoolSessionOwner('user-1')
    useAppStore.getState().setActiveSchoolId('s1')
    useAppStore.getState().setSchoolTransitioning(true)
    vi.clearAllMocks()

    useAppStore.getState().clearSchoolContext()

    expect(useAppStore.getState().activeSchoolId).toBeNull()
    expect(useAppStore.getState().activeSchoolStatus).toBeNull()
    expect(useAppStore.getState().isSchoolTransitioning).toBe(false)
    expect(getSchoolSessionOwner()).toBeNull()
    expect(broadcastSchoolChange).not.toHaveBeenCalled()
  })
})

describe('cookie persistence', () => {
  it('never persists isSchoolTransitioning (partialize)', () => {
    useAppStore.getState().setActiveSchoolId('s1')
    useAppStore.getState().setActiveSchoolId('s2') // transitioning: true
    const persisted = readPersistedCookie()
    expect(persisted).not.toBeNull()
    expect(persisted).not.toHaveProperty('isSchoolTransitioning')
    expect(persisted!.activeSchoolId).toBe('s2')
  })

  it('scrubs a stale isSchoolTransitioning:true from pre-existing cookies on rehydrate', async () => {
    const poisoned = encodeURIComponent(
      JSON.stringify({ state: { activeSchoolId: 's9', isSchoolTransitioning: true }, version: 0 })
    )
    document.cookie = `edforge-app=${poisoned}; path=/`
    await useAppStore.persist.rehydrate()
    expect(useAppStore.getState().activeSchoolId).toBe('s9')
    expect(useAppStore.getState().isSchoolTransitioning).toBe(false)
  })
})
