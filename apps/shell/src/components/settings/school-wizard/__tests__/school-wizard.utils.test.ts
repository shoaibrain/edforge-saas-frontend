import { describe, it, expect } from 'vitest'
import { getDefaultSchoolDays } from '../school-wizard.utils'

describe('getDefaultSchoolDays', () => {
  it('returns Sun–Fri [0,1,2,3,4,5] for bikram_sambat', () => {
    expect(getDefaultSchoolDays('bikram_sambat')).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('returns Mon–Fri [1,2,3,4,5] for gregorian', () => {
    expect(getDefaultSchoolDays('gregorian')).toEqual([1, 2, 3, 4, 5])
  })

  it('returns Mon–Fri [1,2,3,4,5] for unknown calendar systems', () => {
    expect(getDefaultSchoolDays('islamic')).toEqual([1, 2, 3, 4, 5])
  })
})
