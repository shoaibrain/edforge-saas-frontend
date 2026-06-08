/**
 * TopicSection — Collapsible section grouping classwork items by topic
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ClassworkItemResponseDto } from '@aibrains/shared-types'
import { ClassworkItemCard } from './ClassworkItemCard'

interface TopicSectionProps {
  name: string
  items: ClassworkItemResponseDto[]
  defaultOpen?: boolean
  onItemClick?: (item: ClassworkItemResponseDto) => void
}

export function TopicSection({ name, items, defaultOpen = true, onItemClick }: TopicSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left group"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-text-tertiary" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-tertiary" />
        )}
        <h3 className="text-sm font-semibold text-text-primary group-hover:text-[rgb(var(--action-secondary-fg))] dark:group-hover:text-[rgb(var(--action-secondary-fg))] transition-colors">
          {name}
        </h3>
        <span className="text-xs text-text-tertiary">({items.length})</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pl-6">
              {items.map((item) => (
                <ClassworkItemCard
                  key={item.itemId}
                  item={item}
                  onClick={onItemClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
