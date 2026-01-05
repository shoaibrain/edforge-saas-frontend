import { Fragment, type ReactNode } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../utils'

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
          'flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left',
          'bg-white border border-slate-200 rounded-lg shadow-sm',
          'hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
          'transition-colors duration-150',
          buttonClassName
        )}
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute z-50 mt-1 w-full min-w-[200px] origin-top-left rounded-xl bg-white border border-slate-200 shadow-lg focus:outline-none overflow-hidden">
          <div className="py-1">
            {options.map((option) => (
              <MenuItem key={option.id}>
                {({ active }) => (
                  <button
                    onClick={() => onChange(option.id)}
                    className={cn(
                      'flex items-center w-full px-3 py-2.5 text-sm',
                      active ? 'bg-slate-50' : '',
                      value === option.id ? 'text-brand-600' : 'text-slate-700'
                    )}
                  >
                    {option.icon && (
                      <span className="flex-shrink-0 mr-2.5">{option.icon}</span>
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {showCheck && value === option.id && (
                      <Check className="w-4 h-4 text-brand-600 ml-2" />
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

