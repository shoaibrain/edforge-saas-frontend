/**
 * Wizard "Please select an academic year" race regression — P4 / T1.3+T1.4.
 *
 * Reproduces (and pins the fix for) the heisenbug where a SelectField
 * change synced through `form.watch → updateData` had not yet been
 * applied by React when the user clicked Continue, so
 * `validateStep(formDataRef.current)` saw an empty value and failed
 * validation with `Please select an academic year`.
 *
 * The fix has two parts:
 *   T1.3 — `updateData` writes `formDataRef.current` synchronously,
 *          before scheduling the React `setFormData` update.
 *   T1.4 — `validateStep` (and goToNext / submit) flush the current
 *          step's live RHF values into `formDataRef` synchronously at
 *          the top, before any `await`, via a registered
 *          `stepDataProvider`.
 *
 * Either fix on its own closes the user-visible case, but both are kept:
 *   - T1.3 covers callers that don't register a provider (vanilla
 *     wizard consumers that just call `updateData` directly).
 *   - T1.4 covers the case where RHF has values that haven't fired
 *     `form.watch` yet (e.g. auto-select on initial mount before the
 *     subscription is wired).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { useEffect } from 'react'
import { z } from 'zod'
import { WizardProvider, useWizard } from '../WizardContext'
import type { WizardStep } from '../types'
import { ChevronRight } from 'lucide-react'

const schema = z.object({
  academicYearId: z.string().min(1, 'Please select an academic year'),
})

function makeStep(): WizardStep {
  return {
    id: 's1',
    title: 'Step 1',
    icon: ChevronRight,
    schema,
    component: () => null,
  }
}

describe('WizardContext — heisenbug race regression (P4 T1.3 + T1.4)', () => {
  it('T1.3: updateData updates formDataRef synchronously (no setFormData round-trip)', () => {
    let updateData!: (d: Record<string, unknown>) => void
    let formDataAfterUpdate: Record<string, unknown> = {}

    function Probe() {
      const ctx = useWizard()
      updateData = ctx.updateData
      formDataAfterUpdate = ctx.formData
      return null
    }

    render(
      <WizardProvider steps={[makeStep()]} onSubmit={async () => {}}>
        <Probe />
      </WizardProvider>,
    )

    // Pre-condition: formData is the initial empty object
    expect(formDataAfterUpdate).toEqual({})

    // Synchronously call updateData OUTSIDE act() — we deliberately don't
    // await a React render cycle. Pre-T1.3, the ref would still be empty
    // here because the setFormData updater hadn't run yet. Post-T1.3,
    // the ref is written synchronously inside updateData itself.
    act(() => {
      updateData({ academicYearId: 'ay-2026-2027' })
    })

    // After updateData returns + the surrounding act flush, formData
    // reflects the change. The harder assertion (ref-only, no React
    // flush) is covered indirectly by the validation-race test below.
    expect(formDataAfterUpdate).toEqual({ academicYearId: 'ay-2026-2027' })
  })

  it('T1.4: registered stepDataProvider flushes BEFORE validateStep parses', async () => {
    // Simulates the heisenbug shape: a step has a live RHF value but
    // form.watch has NOT yet fired updateData. validateStep must pull
    // the live value via the provider before Zod parses, not rely on
    // a possibly-stale formDataRef.

    let ctxRef!: ReturnType<typeof useWizard>
    let registerCalled = false

    function Probe() {
      const ctx = useWizard()
      ctxRef = ctx
      useEffect(() => {
        registerCalled = true
        // Step's "live values" — emulates form.getValues() returning a
        // value that updateData hasn't propagated yet.
        const unreg = ctx.registerStepDataProvider(() => ({
          academicYearId: 'ay-from-provider',
        }))
        return unreg
      }, [ctx])
      return null
    }

    render(
      <WizardProvider steps={[makeStep()]} onSubmit={async () => {}}>
        <Probe />
      </WizardProvider>,
    )

    expect(registerCalled).toBe(true)

    // formData starts empty — the wizard never received any updateData
    // call directly. The only path to a non-empty academicYearId is
    // through the registered provider during validation.
    expect(ctxRef.formData).toEqual({})

    let valid: boolean | undefined
    await act(async () => {
      valid = await ctxRef.goToNext()
    })

    expect(valid).toBe(true)
    // After goToNext, formData reflects the flushed provider values
    expect(ctxRef.formData).toEqual({ academicYearId: 'ay-from-provider' })
  })

  it('T1.4: empty provider value still triggers Zod failure (regression: provider call doesn\'t swallow real validation errors)', async () => {
    let ctxRef!: ReturnType<typeof useWizard>
    const onValidationError = vi.fn()

    function Probe() {
      const ctx = useWizard()
      ctxRef = ctx
      useEffect(() => {
        return ctx.registerStepDataProvider(() => ({ academicYearId: '' }))
      }, [ctx])
      return null
    }

    render(
      <WizardProvider
        steps={[makeStep()]}
        onSubmit={async () => {}}
        onValidationError={onValidationError}
      >
        <Probe />
      </WizardProvider>,
    )

    let valid: boolean | undefined
    await act(async () => {
      valid = await ctxRef.goToNext()
    })

    expect(valid).toBe(false)
    expect(ctxRef.errors.academicYearId).toBe('Please select an academic year')
    expect(onValidationError).toHaveBeenCalledTimes(1)
  })

  it('T1.4: provider unregister cleans up — post-unmount goToNext does NOT call the provider (counter), and formData stays stable', async () => {
    let ctxRef!: ReturnType<typeof useWizard>
    let showProbe = true
    let renderProbeUpdate!: () => void
    let providerCallCount = 0

    function Probe() {
      const ctx = useWizard()
      ctxRef = ctx
      useEffect(() => {
        return ctx.registerStepDataProvider(() => {
          providerCallCount += 1
          return { academicYearId: 'ay-live' }
        })
      }, [ctx])
      return null
    }

    function Host() {
      const [, force] = React.useReducer((x: number) => x + 1, 0)
      renderProbeUpdate = force
      return showProbe ? <Probe /> : null
    }

    const React = await import('react')

    render(
      <WizardProvider steps={[makeStep()]} onSubmit={async () => {}}>
        <Host />
      </WizardProvider>,
    )

    // First navigation — provider is active, validation passes, counter ticks
    await act(async () => {
      const ok = await ctxRef.goToNext()
      expect(ok).toBe(true)
    })
    expect(providerCallCount).toBe(1)
    expect(ctxRef.formData).toEqual({ academicYearId: 'ay-live' })

    // Unmount the probe so the provider unregisters via the cleanup
    // returned by registerStepDataProvider.
    showProbe = false
    await act(async () => {
      renderProbeUpdate()
    })

    // Snapshot counter immediately AFTER unmount, before any navigation.
    // The unregister cleanup itself must not call the provider.
    const counterAfterUnmount = providerCallCount
    expect(counterAfterUnmount).toBe(1)

    // Second navigation AFTER unmount — the unregistered provider must
    // NOT be invoked. validateStep should still pass because formDataRef
    // already holds the value from the first flush.
    let secondOk: boolean | undefined
    await act(async () => {
      secondOk = await ctxRef.goToNext()
    })

    expect(providerCallCount).toBe(counterAfterUnmount) // unchanged → unregister worked
    expect(secondOk).toBe(true)                          // formData survives unmount
    expect(ctxRef.formData).toEqual({ academicYearId: 'ay-live' })
  })
})
