import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

import { toast } from 'sonner'
import { queryClient, armSchoolTransitionErrorToast } from '../query-client'

const onError = queryClient.getQueryCache().config.onError!

function fireError(queryKey: readonly unknown[], status?: number) {
  const error = Object.assign(new Error('boom'), status ? { response: { status } } : {})
  onError(error, { queryKey } as never)
}

let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleSpy.mockRestore()
})

describe('school transition error toast', () => {
  it('fires once for a school-scoped error after arming, then stays quiet', () => {
    armSchoolTransitionErrorToast('s2')
    fireError(['home', 'overview', 's2'])
    fireError(['home', 'alerts', 's2'])
    expect(toast.error).toHaveBeenCalledTimes(1)
  })

  it('fires again after re-arming for a new transition', () => {
    armSchoolTransitionErrorToast('s2')
    fireError(['x', 's2'])
    armSchoolTransitionErrorToast('s3')
    fireError(['x', 's3'])
    expect(toast.error).toHaveBeenCalledTimes(2)
  })

  it('ignores errors from queries not scoped to the switched school', () => {
    armSchoolTransitionErrorToast('s2')
    fireError(['userProfile'])
    fireError(['x', 's1'])
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('ignores 404s (expected for schools without the resource yet)', () => {
    armSchoolTransitionErrorToast('s2')
    fireError(['schoolConfiguration', 's2'], 404)
    expect(toast.error).not.toHaveBeenCalled()
    // a real failure afterwards still surfaces
    fireError(['home', 'overview', 's2'], 500)
    expect(toast.error).toHaveBeenCalledTimes(1)
  })
})
