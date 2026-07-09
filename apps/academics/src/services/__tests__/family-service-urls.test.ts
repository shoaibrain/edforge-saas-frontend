/**
 * Service-URL guard for the family (family-billing) endpoints on the
 * academics service. Pins the exact apiGet/apiPost/apiPatch/apiDelete URLs
 * against the live backend routes so a refactor can't silently invent a
 * wrong path (a past PR shipped invented URLs that 403'd in prod).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({
  api: {},
  apiGet: vi.fn().mockResolvedValue({}),
  apiPost: vi.fn().mockResolvedValue({}),
  apiPatch: vi.fn().mockResolvedValue({}),
  apiDelete: vi.fn().mockResolvedValue({}),
}))

import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api'
import {
  getStudentFamily,
  listFamilies,
  getFamilyMembers,
  createFamily,
  updateFamily,
  deactivateFamily,
  addFamilyMember,
  removeFamilyMember,
} from '../academics.service'

const get = apiGet as unknown as ReturnType<typeof vi.fn>
const post = apiPost as unknown as ReturnType<typeof vi.fn>
const patch = apiPatch as unknown as ReturnType<typeof vi.fn>
const del = apiDelete as unknown as ReturnType<typeof vi.fn>

const SCHOOL = 'sch-1'
const FAMILY = 'fam-1'
const STUDENT = 'stu-1'

describe('family service URLs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getStudentFamily → GET /academics/students/:studentId/family?schoolId=', async () => {
    await getStudentFamily(STUDENT, SCHOOL)
    expect(get).toHaveBeenCalledWith(`/academics/students/${STUDENT}/family`, {
      schoolId: SCHOOL,
    })
  })

  it('listFamilies → GET /academics/schools/:schoolId/families (no params → {})', async () => {
    await listFamilies(SCHOOL)
    expect(get).toHaveBeenCalledWith(
      `/academics/schools/${SCHOOL}/families`,
      {},
    )
  })

  it('listFamilies → forwards namePrefix/limit/cursor query params', async () => {
    await listFamilies(SCHOOL, { namePrefix: 'Sha', limit: 20, cursor: 'c1' })
    expect(get).toHaveBeenCalledWith(`/academics/schools/${SCHOOL}/families`, {
      namePrefix: 'Sha',
      limit: 20,
      cursor: 'c1',
    })
  })

  it('getFamilyMembers → GET .../families/:familyId/members', async () => {
    await getFamilyMembers(SCHOOL, FAMILY)
    expect(get).toHaveBeenCalledWith(
      `/academics/schools/${SCHOOL}/families/${FAMILY}/members`,
    )
  })

  it('createFamily → POST /academics/schools/:schoolId/families with body', async () => {
    const body = {
      schoolId: SCHOOL,
      name: 'Sharma',
      primaryContact: { name: 'Ram Sharma', phone: '9800000000' },
    }
    await createFamily(SCHOOL, body)
    expect(post).toHaveBeenCalledWith(
      `/academics/schools/${SCHOOL}/families`,
      body,
    )
  })

  it('updateFamily → PATCH .../families/:familyId with body', async () => {
    const body = { name: 'Sharma-Thapa' }
    await updateFamily(SCHOOL, FAMILY, body)
    expect(patch).toHaveBeenCalledWith(
      `/academics/schools/${SCHOOL}/families/${FAMILY}`,
      body,
    )
  })

  it('deactivateFamily → DELETE .../families/:familyId', async () => {
    await deactivateFamily(SCHOOL, FAMILY)
    expect(del).toHaveBeenCalledWith(
      `/academics/schools/${SCHOOL}/families/${FAMILY}`,
    )
  })

  it('addFamilyMember → POST .../families/:familyId/members with body', async () => {
    const body = { studentId: STUDENT, relationshipNote: 'younger sibling' }
    await addFamilyMember(SCHOOL, FAMILY, body)
    expect(post).toHaveBeenCalledWith(
      `/academics/schools/${SCHOOL}/families/${FAMILY}/members`,
      body,
    )
  })

  it('removeFamilyMember → DELETE .../families/:familyId/members/:studentId', async () => {
    await removeFamilyMember(SCHOOL, FAMILY, STUDENT)
    expect(del).toHaveBeenCalledWith(
      `/academics/schools/${SCHOOL}/families/${FAMILY}/members/${STUDENT}`,
    )
  })
})
