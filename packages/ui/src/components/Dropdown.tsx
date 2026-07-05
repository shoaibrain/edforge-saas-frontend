import { Fragment, type ReactNode } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { ChevronDown, Check } from 'lucide-react'
import { cn, focusRing, focusRingInset } from '../utils'

export interface DropdownOption {
  id: string
  label: string
  description?: string
  icon?: ReactNode
}

interface DropdownProps {
  options: DropdownOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
  /** Show checkmark next to selected item */
  showCheck?: boolean
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  buttonClassName,
  showCheck = true,
}: DropdownProps) {
  const selectedOption = options.find((o) => o.id === value)

  return (
    <Menu as="div" className={cn('relative', className)}>
      <MenuButton
        className={cn(
          'ef-motion flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-start',
          'bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-sm',
          'hover:bg-[rgb(var(--background-tertiary))]',
          focusRing,
          'transition-colors duration-fast ease-standard',
          buttonClassName
        )}
      >
        <span className={selectedOption ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-tertiary))]'}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))] ms-2" />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-enter duration-fast"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-exit duration-instant"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute z-50 mt-1 w-full min-w-52 origin-top-left rounded-xl bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] shadow-popover focus:outline-none overflow-hidden">
          <div className="py-1">
            {options.map((option) => (
              <MenuItem key={option.id}>
                {({ active }) => (
                  <button
                    onClick={() => onChange(option.id)}
                    className={cn(
                      'ef-motion flex items-center w-full px-3 py-2.5 text-sm',
                      focusRingInset,
                      active ? 'bg-[rgb(var(--background-secondary))]' : '',
                      value === option.id ? 'text-[rgb(var(--action-secondary-fg))]' : 'text-[rgb(var(--text-primary))]'
                    )}
                  >
                    {option.icon && (
                      <span className="flex-shrink-0 me-2.5">{option.icon}</span>
                    )}
                    <div className="flex-1 text-start">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {showCheck && value === option.id && (
                      <Check className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] ms-2" />
                    )}
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}
