/**
 * Sample test to verify Vitest infrastructure works.
 */

import { describe, it, expect } from 'vitest'
import { expectSchemaValid, expectSchemaInvalid } from './index'
import { z } from 'zod'

describe('Vitest Setup', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('supports @testing-library/jest-dom matchers', () => {
    const div = document.createElement('div')
    div.textContent = 'EdForge'
    document.body.appendChild(div)
    expect(div).toBeInTheDocument()
    document.body.removeChild(div)
  })
})

describe('Test Utilities', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  })

  it('expectSchemaValid passes for valid data', () => {
    const result = expectSchemaValid(testSchema, { name: 'Test', age: 25 })
    expect(result.name).toBe('Test')
    expect(result.age).toBe(25)
  })

  it('expectSchemaValid throws for invalid data', () => {
    expect(() => expectSchemaValid(testSchema, { name: '', age: -1 })).toThrow()
  })

  it('expectSchemaInvalid returns errors for invalid data', () => {
    const error = expectSchemaInvalid(testSchema, { name: '', age: -1 })
    expect(error.issues.length).toBeGreaterThan(0)
  })

  it('expectSchemaInvalid checks specific path', () => {
    const error = expectSchemaInvalid(testSchema, { name: '', age: 25 }, 'name')
    expect(error.issues.some((i) => i.path.join('.') === 'name')).toBe(true)
  })
})
