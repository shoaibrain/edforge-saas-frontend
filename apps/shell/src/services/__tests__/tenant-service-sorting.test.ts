import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
  apiPatch: vi.fn(),
}))

import { getSchools } from '../tenant.service'
import { apiGet } from '../../lib/api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSchools', () => {
  it('sorts schools by name regardless of API (DynamoDB key) order', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      items: [
        { schoolId: 's3', name: 'Golden Gate School', schoolCode: 'GG', status: 'active' },
        { schoolId: 's1', name: 'Scoggins Middle School', schoolCode: 'SM', status: 'active' },
        { schoolId: 's2', name: 'Alpha Academy', schoolCode: 'AA', status: 'active' },
      ],
      hasMore: false,
    } as never)

    const schools = await getSchools('tenant-1')
    expect(schools.map((s) => s.name)).toEqual([
      'Alpha Academy',
      'Golden Gate School',
      'Scoggins Middle School',
    ])
  })
})
