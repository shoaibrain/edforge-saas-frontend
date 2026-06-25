/**
 * Orphaned Schools Banner
 *
 * Shows a warning banner when schools are not assigned to any LEA.
 * Opens the SchoolAssignmentManager modal for bulk-assigning schools to districts.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { useIsTenantAdmin } from '@edforge/abac'
import { cn } from '@/lib/utils'
import type { HierarchyNode } from '@aibrains/shared-types'
import { SchoolAssignmentManager } from './SchoolAssignmentManager'

// ============================================================================
// ORPHANED SCHOOLS BANNER
// ============================================================================

export interface OrphanedSchoolsBannerProps {
  orphanedSchools: HierarchyNode[]
}

export function OrphanedSchoolsBanner({ orphanedSchools }: OrphanedSchoolsBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const canManage = useIsTenantAdmin()

  if (orphanedSchools.length === 0) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-3 p-4 rounded-xl border',
          'bg-amber-500/5 border-amber-500/20'
        )}
      >
        <div className="p-2 rounded-lg bg-amber-500/10">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {orphanedSchools.length} {orphanedSchools.length === 1 ? 'school is' : 'schools are'} not
            assigned to a district
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
            Assign schools to a Local Education Agency (LEA) for proper Ed-Fi reporting.
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
            onClick={() => setIsModalOpen(true)}
          >
            Assign Schools
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </motion.div>

      {/* Assignment Modal */}
      <SchoolAssignmentManager
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schools={orphanedSchools}
        mode="orphaned-only"
      />
    </>
  )
}

export default OrphanedSchoolsBanner
