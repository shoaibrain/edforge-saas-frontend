/**
 * Guardian Linking Wizard Step
 * 
 * Step for linking students to their parents/guardians.
 * Features:
 * - Search existing guardians
 * - Quick-add new guardian inline
 * - Multiple guardian support
 * - Primary contact designation
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Search,
  Plus,
  X,
  Check,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface Guardian {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  relationship?: string
  isPrimary?: boolean
}

// ============================================================================
// MOCK DATA - Replace with API calls
// ============================================================================

const MOCK_GUARDIANS: Guardian[] = [
  { id: '1', firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com', phone: '(555) 123-4567' },
  { id: '2', firstName: 'Mary', lastName: 'Smith', email: 'mary.smith@email.com', phone: '(555) 234-5678' },
  { id: '3', firstName: 'Robert', lastName: 'Johnson', email: 'robert.j@email.com', phone: '(555) 345-6789' },
  { id: '4', firstName: 'Patricia', lastName: 'Williams', email: 'p.williams@email.com', phone: '(555) 456-7890' },
]

const RELATIONSHIPS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Legal Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other', label: 'Other' },
]

// ============================================================================
// SEARCH INPUT COMPONENT
// ============================================================================

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <motion.div
      animate={{
        borderColor: focused ? 'rgb(10, 147, 150)' : 'rgb(var(--border-primary))',
        boxShadow: focused
          ? '0 0 0 3px rgba(10, 147, 150, 0.15)'
          : '0 0 0 0px transparent',
      }}
      transition={{ duration: 0.2 }}
      className="relative rounded-xl border-2 bg-[rgb(var(--surface-tertiary))] overflow-hidden"
    >
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-11 pr-4 py-3 bg-transparent',
          'text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
          'focus:outline-none text-sm'
        )}
      />
    </motion.div>
  )
}

// ============================================================================
// GUARDIAN CARD COMPONENT
// ============================================================================

interface GuardianCardProps {
  guardian: Guardian
  selected: boolean
  onSelect: () => void
  onRemove?: () => void
  showRelationship?: boolean
  relationship?: string
  onRelationshipChange?: (value: string) => void
  isPrimary?: boolean
  onSetPrimary?: () => void
}

function GuardianCard({
  guardian,
  selected,
  onSelect,
  onRemove,
  showRelationship,
  relationship,
  onRelationshipChange,
  isPrimary,
  onSetPrimary,
}: GuardianCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      animate={{
        scale: hovered ? 1.01 : 1,
        y: selected ? -2 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
        selected
          ? 'border-teal-500 dark:border-cyan-500 bg-teal-500/5 dark:bg-cyan-500/5'
          : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))]'
      )}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-teal-500 dark:bg-cyan-500 flex items-center justify-center shadow-md"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-rust-400/20 flex items-center justify-center flex-shrink-0">
          <Heart className="w-5 h-5 text-rust-500" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-[rgb(var(--text-primary))]">
              {guardian.firstName} {guardian.lastName}
            </p>
            {isPrimary && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-teal-500/15 text-teal-700 dark:text-cyan-300">
                Primary
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-[rgb(var(--text-tertiary))]">
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {guardian.email}
            </span>
            {guardian.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {guardian.phone}
              </span>
            )}
          </div>

          {/* Relationship selector */}
          {showRelationship && selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <select
                value={relationship || ''}
                onChange={(e) => onRelationshipChange?.(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="">Select relationship...</option>
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel.value} value={rel.value}>
                    {rel.label}
                  </option>
                ))}
              </select>
              {!isPrimary && onSetPrimary && (
                <button
                  type="button"
                  onClick={onSetPrimary}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors"
                >
                  Set Primary
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Remove button */}
        {onRemove && selected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="p-1.5 rounded-lg text-rust-500 hover:bg-rust-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// QUICK ADD GUARDIAN FORM
// ============================================================================

interface QuickAddGuardianProps {
  onAdd: (guardian: Omit<Guardian, 'id'>) => void
  onCancel: () => void
}

function QuickAddGuardian({ onAdd, onCancel }: QuickAddGuardianProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [relationship, setRelationship] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      firstName,
      lastName,
      email,
      phone,
      relationship,
    })
  }

  const isValid = firstName && lastName && email

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onSubmit={handleSubmit}
      className="p-4 rounded-xl border-2 border-dashed border-teal-500/50 dark:border-cyan-500/50 bg-teal-500/5 dark:bg-cyan-500/5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Plus className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
        <h4 className="font-medium text-[rgb(var(--text-primary))]">Quick Add Guardian</h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="First Name *"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        />
        <input
          type="text"
          placeholder="Last Name *"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        />
        <input
          type="email"
          placeholder="Email Address *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        />
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="col-span-2 px-3 py-2 text-sm rounded-lg bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        >
          <option value="">Select relationship...</option>
          {RELATIONSHIPS.map((rel) => (
            <option key={rel.value} value={rel.value}>
              {rel.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            isValid
              ? 'bg-teal-500 text-white hover:bg-teal-600'
              : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))] cursor-not-allowed'
          )}
        >
          Add Guardian
        </button>
      </div>
    </motion.form>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GuardianLinkingStep({
  data,
  updateData,
  errors,
}: WizardStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  // Get selected guardians from data
  const selectedGuardians = (data.guardians as Guardian[]) || []

  // Filter guardians based on search
  const filteredGuardians = MOCK_GUARDIANS.filter(
    (g) =>
      g.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Check if guardian is selected
  const isSelected = (guardian: Guardian) =>
    selectedGuardians.some((g) => g.id === guardian.id)

  // Toggle guardian selection
  const toggleGuardian = useCallback((guardian: Guardian) => {
    if (isSelected(guardian)) {
      updateData({
        guardians: selectedGuardians.filter((g) => g.id !== guardian.id),
      })
    } else {
      updateData({
        guardians: [
          ...selectedGuardians,
          { ...guardian, isPrimary: selectedGuardians.length === 0 },
        ],
      })
    }
  }, [selectedGuardians, updateData])

  // Remove guardian
  const removeGuardian = useCallback((guardianId: string) => {
    const remaining = selectedGuardians.filter((g) => g.id !== guardianId)
    // Ensure there's always a primary if guardians exist
    if (remaining.length > 0 && !remaining.some((g) => g.isPrimary)) {
      remaining[0].isPrimary = true
    }
    updateData({ guardians: remaining })
  }, [selectedGuardians, updateData])

  // Update relationship
  const updateRelationship = useCallback((guardianId: string, relationship: string) => {
    updateData({
      guardians: selectedGuardians.map((g) =>
        g.id === guardianId ? { ...g, relationship } : g
      ),
    })
  }, [selectedGuardians, updateData])

  // Set primary guardian
  const setPrimary = useCallback((guardianId: string) => {
    updateData({
      guardians: selectedGuardians.map((g) => ({
        ...g,
        isPrimary: g.id === guardianId,
      })),
    })
  }, [selectedGuardians, updateData])

  // Add new guardian
  const addNewGuardian = useCallback((guardian: Omit<Guardian, 'id'>) => {
    const newGuardian: Guardian = {
      ...guardian,
      id: `new-${Date.now()}`,
      isPrimary: selectedGuardians.length === 0,
    }
    updateData({
      guardians: [...selectedGuardians, newGuardian],
    })
    setShowQuickAdd(false)
  }, [selectedGuardians, updateData])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Selected Guardians */}
      {selectedGuardians.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-3">
            Selected Guardians ({selectedGuardians.length})
          </h3>
          <div className="space-y-3">
            {selectedGuardians.map((guardian) => (
              <GuardianCard
                key={guardian.id}
                guardian={guardian}
                selected={true}
                onSelect={() => {}}
                onRemove={() => removeGuardian(guardian.id)}
                showRelationship
                relationship={guardian.relationship}
                onRelationshipChange={(rel) => updateRelationship(guardian.id, rel)}
                isPrimary={guardian.isPrimary}
                onSetPrimary={() => setPrimary(guardian.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search and Add */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            Find Guardian
          </h3>
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-teal-600 dark:text-cyan-400 hover:text-teal-700 dark:hover:text-cyan-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search guardians by name or email..."
        />
      </div>

      {/* Quick Add Form */}
      <AnimatePresence>
        {showQuickAdd && (
          <QuickAddGuardian
            onAdd={addNewGuardian}
            onCancel={() => setShowQuickAdd(false)}
          />
        )}
      </AnimatePresence>

      {/* Search Results */}
      {!showQuickAdd && searchQuery && (
        <div className="space-y-3">
          {filteredGuardians.length > 0 ? (
            filteredGuardians.map((guardian) => (
              <GuardianCard
                key={guardian.id}
                guardian={guardian}
                selected={isSelected(guardian)}
                onSelect={() => toggleGuardian(guardian)}
              />
            ))
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-[rgb(var(--text-tertiary))] mb-2" />
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                No guardians found matching "{searchQuery}"
              </p>
              <button
                type="button"
                onClick={() => setShowQuickAdd(true)}
                className="mt-2 text-sm font-medium text-teal-600 dark:text-cyan-400 hover:underline"
              >
                Create a new guardian
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!showQuickAdd && !searchQuery && selectedGuardians.length === 0 && (
        <div className="p-8 text-center bg-[rgb(var(--surface-tertiary))] rounded-xl border border-[rgb(var(--border-primary))]">
          <Heart className="w-12 h-12 mx-auto text-rust-400 mb-3" />
          <h3 className="font-medium text-[rgb(var(--text-primary))] mb-1">
            Link to a Guardian
          </h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
            Search for an existing guardian or create a new one
          </p>
        </div>
      )}

      {/* Validation Error */}
      {errors.guardians && (
        <p className="flex items-center gap-1.5 text-xs text-rust-500">
          <AlertCircle className="w-3.5 h-3.5" />
          {errors.guardians}
        </p>
      )}
    </motion.div>
  )
}
