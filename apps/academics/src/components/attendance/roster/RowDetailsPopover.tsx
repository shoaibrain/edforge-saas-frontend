/**
 * RowDetailsPopover — note + (conditional) absence-reason in ONE portal popover.
 *
 * Replaces the inline reason `<Select>` and note `<Input>` that expanded UNDER
 * the row and made row heights jump (breaking virtualization's fixed row height).
 * Anchored to the comment trigger and portaled so it escapes the roster's
 * `overflow-auto` clip. The reason field only shows for absent/excused; a small
 * amber dot on the trigger signals "reason still needed" so it stays discoverable
 * even though it's no longer auto-expanded.
 */

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { MessageSquare } from 'lucide-react'
import { Input, Select, focusRingInset } from '@edforge/ui'
import type { AttendanceStatus } from '../../../services/academics.service'
import { EXCUSE_TYPES } from './excuseTypes'

export interface RowDetailsPopoverProps {
  status: AttendanceStatus | null
  notes: string
  excuseType?: string
  onNotesChange: (notes: string) => void
  onExcuseTypeChange?: (excuseType: string) => void
  disabled?: boolean
}

export function RowDetailsPopover({
  status,
  notes,
  excuseType,
  onNotesChange,
  onExcuseTypeChange,
  disabled = false,
}: RowDetailsPopoverProps) {
  const showReason = status === 'absent' || status === 'excused'
  const hasDetails = !!notes || !!excuseType
  const needsReason = showReason && !excuseType

  return (
    <Popover className="relative">
      <PopoverButton
        type="button"
        disabled={disabled}
        aria-label={hasDetails ? 'Edit note or reason' : 'Add note or reason'}
        title={hasDetails ? 'Edit note / reason' : 'Add note / reason'}
        className={`relative rounded-lg p-2 transition-colors ${focusRingInset} disabled:opacity-50 ${
          hasDetails
            ? 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--action-secondary-fg))]'
            : 'text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary'
        }`}
      >
        <MessageSquare className="h-4 w-4" />
        {needsReason && (
          <span
            data-testid="needs-reason-dot"
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[rgb(var(--state-warning-border))]"
          />
        )}
      </PopoverButton>
      <PopoverPanel
        anchor="bottom end"
        className="z-50 w-64 rounded-xl border border-border-primary bg-surface-primary p-3 shadow-xl [--anchor-gap:6px]"
      >
        <div className="space-y-3">
          {showReason && (
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Reason</label>
              <Select
                size="sm"
                aria-label="Absence reason"
                value={excuseType || ''}
                onChange={(v) => onExcuseTypeChange?.(v ?? '')}
                clearable
                placeholder="Select reason..."
                options={EXCUSE_TYPES}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Note</label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add a note..."
              aria-label="Attendance note"
            />
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  )
}
