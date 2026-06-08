import { Fragment } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '../../utils'
import type { RowAction } from './types'

interface DataTableRowActionsProps<TData> {
  actions: RowAction<TData>[]
  row: TData
}

export function DataTableRowActions<TData>({
  actions,
  row,
}: DataTableRowActionsProps<TData>) {
  const visibleActions = actions.filter((a) => !a.hidden)
  if (visibleActions.length === 0) return null

  return (
    <Menu as="div" className="relative">
      <MenuButton className="p-1.5 rounded-md hover:bg-[rgb(var(--background-secondary))] transition-colors">
        <MoreHorizontal className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <span className="sr-only">Open actions</span>
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
        <MenuItems className="absolute right-0 z-50 mt-1 w-44 origin-top-right rounded-xl bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] shadow-lg focus:outline-none overflow-hidden">
          <div className="py-1">
            {visibleActions.map((action, i) => (
              <Fragment key={i}>
                {action.divider && i > 0 && (
                  <div className="my-1 border-t border-[rgb(var(--border-secondary))]" />
                )}
                <MenuItem>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => action.onClick(row)}
                      disabled={action.disabled}
                      className={cn(
                        'flex items-center w-full px-3 py-2 text-sm transition-colors',
                        active && 'bg-[rgb(var(--background-secondary))]',
                        action.variant === 'danger'
                          ? 'text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)]'
                          : 'text-[rgb(var(--text-primary))]',
                        action.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {action.icon && (
                        <span className="flex-shrink-0 mr-2.5 w-4 h-4">
                          {action.icon}
                        </span>
                      )}
                      {action.label}
                    </button>
                  )}
                </MenuItem>
              </Fragment>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}
