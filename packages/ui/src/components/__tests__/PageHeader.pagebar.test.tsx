/**
 * PageHeader pagebar-mode contract (S0 scaffold → filled in S1).
 *
 * The current PageHeader always renders an <h1>. Pagebar mode replaces the
 * title/subtitle with a year switcher + date + actions and renders NO <h1>
 * (the breadcrumb is the page name, the StatBand is the summary). Titled mode
 * is unchanged so the 31+ existing consumers keep compiling.
 */
import { describe, it } from 'vitest'

describe('PageHeader pagebar mode contract', () => {
  it.todo('renders zero <h1> in pagebar mode')
  it.todo('still renders exactly one <h1> in titled mode (back-compat)')
  it.todo('renders the year switcher chip and date in pagebar mode')
  it.todo('renders right-aligned actions with the primary action styled distinctly')
  it.todo('applies the shared focusRing to the year switcher and actions')
})
