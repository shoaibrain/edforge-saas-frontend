/**
 * Service-URL guard for the portal-account endpoints on the identity service.
 * Pins the exact apiPost URLs against the deployed API-B routes.
 *
 * These two calls shipped with an `/identity` prefix that does not exist in the
 * deployed spec, so API Gateway fell through to IAM auth and returned 403 —
 * which the shell surfaced as an "Access Denied" toast, misattributing a
 * routing bug as a permissions problem.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({
  api: {},
  apiGet: vi.fn().mockResolvedValue({}),
  apiPost: vi.fn().mockResolvedValue({}),
  apiPatch: vi.fn().mockResolvedValue({}),
  apiDelete: vi.fn().mockResolvedValue({}),
}))

import { apiPost } from '../../lib/api'
import { createParentAccount, createStudentAccount } from '../academics.service'

const post = apiPost as unknown as ReturnType<typeof vi.fn>

const SCHOOL = 'sch-1'
const STUDENT = 'stu-1'

describe('portal account service URLs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createParentAccount → POST /users/parent-accounts with body', async () => {
    const body = {
      email: 'guardian@example.com',
      firstName: 'Guardian',
      lastName: 'One',
      phone: '9800000000',
      schoolId: SCHOOL,
      studentId: STUDENT,
      guardianId: 'grd-1',
    }
    await createParentAccount(body)
    expect(post).toHaveBeenCalledWith('/users/parent-accounts', body)
  })

  it('createStudentAccount → POST /users/student-accounts with body', async () => {
    const body = {
      email: 'student@example.com',
      firstName: 'Student',
      lastName: 'One',
      schoolId: SCHOOL,
      studentId: STUDENT,
    }
    await createStudentAccount(body)
    expect(post).toHaveBeenCalledWith('/users/student-accounts', body)
  })

  it('neither portal-account URL carries an /identity prefix', async () => {
    await createParentAccount({
      email: 'guardian@example.com',
      firstName: 'Guardian',
      lastName: 'One',
      schoolId: SCHOOL,
      studentId: STUDENT,
    })
    await createStudentAccount({
      email: 'student@example.com',
      firstName: 'Student',
      lastName: 'One',
      schoolId: SCHOOL,
      studentId: STUDENT,
    })
    for (const [url] of post.mock.calls) {
      expect(url).not.toMatch(/^\/identity\//)
    }
  })
})
