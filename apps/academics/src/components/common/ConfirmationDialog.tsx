/**
 * ConfirmationDialog Component
 *
 * A reusable confirmation dialog for destructive or important actions.
 * Uses Headless UI Dialog for accessibility.
 */

import { Fragment, type ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@edforge/ui'

export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Called when the dialog should close */
  onClose: () => void
  /** Called when the user confirms the action */
  onConfirm: () => void | Promise<void>
  /** Dialog title */
  title: string
  /** Dialog description/message */
  description?: string
  /** Confirm button text */
  confirmText?: string
  /** Cancel button text */
  cancelText?: string
  /** Variant affects styling - destructive shows warning colors */
  variant?: 'default' | 'destructive'
  /** Whether the confirm action is in progress */
  isLoading?: boolean
  /** Custom icon to show */
  icon?: ReactNode
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
  icon,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  const isDestructive = variant === 'destructive'

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        {/* Dialog */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-primary border border-border-primary p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isDestructive
                        ? 'bg-red-100 dark:bg-red-500/20'
                        : 'bg-teal-100 dark:bg-teal-500/20'
                    }`}
                  >
                    {icon || (
                      <AlertTriangle
                        className={`w-5 h-5 ${
                          isDestructive
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-teal-600 dark:text-teal-400'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold text-text-primary"
                    >
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-2 text-sm text-text-secondary">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    type="button"
                    variant={isDestructive ? 'danger' : 'primary'}
                    onClick={handleConfirm}
                    disabled={isLoading}
                    isLoading={isLoading}
                  >
                    {confirmText}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
