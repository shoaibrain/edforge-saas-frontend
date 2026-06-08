#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

const recipes = new Set(['settings-page', 'form-drawer', 'wizard-step', 'data-table-page'])

function usage() {
  console.log(`Usage:
  pnpm scaffold:mfe-page <recipe> <target-file> [ComponentName] [Page Title]

Recipes:
  settings-page
  form-drawer
  wizard-step
  data-table-page

Example:
  pnpm scaffold:mfe-page settings-page apps/finance/src/routes/configuration/tax-settings.tsx TaxSettingsPage "Tax settings"
`)
}

function toComponentName(filePath) {
  const base = filePath
    .split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
  const candidate = base ? base.charAt(0).toUpperCase() + base.slice(1) : 'GeneratedPage'
  return /^[A-Z]/.test(candidate) ? candidate : `Generated${candidate}`
}

const [, , recipe, targetFile, componentNameArg, pageTitleArg] = process.argv

if (!recipe || !targetFile || !recipes.has(recipe)) {
  usage()
  process.exit(recipe || targetFile ? 1 : 0)
}

const componentName = componentNameArg ?? toComponentName(targetFile)
const pageTitle = pageTitleArg ?? componentName.replace(/([A-Z])/g, ' $1').trim()
const templatePath = resolve(repoRoot, 'templates/mfe-page', `${recipe}.tsx`)
const targetPath = resolve(repoRoot, targetFile)

await mkdir(dirname(targetPath), { recursive: true })

const template = await readFile(templatePath, 'utf8')
const rendered = template
  .replaceAll('__PAGE_COMPONENT__', componentName)
  .replaceAll('__PAGE_TITLE__', pageTitle)

await writeFile(targetPath, rendered, { flag: 'wx' }).catch(async (error) => {
  if (error?.code !== 'EEXIST') throw error
  const backupPath = `${targetPath}.new`
  await copyFile(templatePath, backupPath)
  throw new Error(`Target already exists: ${targetFile}. Wrote untouched template to ${backupPath}`)
})

console.log(`Created ${targetFile} from ${recipe}`)
