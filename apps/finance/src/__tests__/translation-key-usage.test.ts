import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import payments from '@edforge/i18n/locales/en/payments.json'

type LocaleObject = Record<string, unknown>

const SOURCE_ROOT = path.resolve(process.cwd(), 'apps/finance/src')
const LITERAL_T_KEY_PATTERN = /\bt\(\s*['"]([^'"`]+)['"]/g

function walkSourceFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walkSourceFiles(fullPath, files)
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function valueAt(resource: LocaleObject, key: string): unknown {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined
    }

    return (current as LocaleObject)[segment]
  }, resource)
}

describe('Finance translation key usage', () => {
  it('resolves literal payments namespace keys used by Finance source', () => {
    const missing: string[] = []

    for (const file of walkSourceFiles(SOURCE_ROOT)) {
      const source = fs.readFileSync(file, 'utf8')

      for (const match of source.matchAll(LITERAL_T_KEY_PATTERN)) {
        const key = match[1]

        if (typeof valueAt(payments as LocaleObject, key) !== 'string') {
          missing.push(`${path.relative(process.cwd(), file)} -> ${key}`)
        }
      }
    }

    expect(missing, `Missing payments.json keys:\n${missing.join('\n')}`).toEqual([])
  })
})
