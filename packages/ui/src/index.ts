/**
 * @edforge/ui
 *
 * Shared UI component library for the EdForge EMIS platform.
 * Built with React, Tailwind CSS, and class-variance-authority.
 */

// Utilities
export { cn, getUserAvatar } from './utils'

// Components
export { Button, buttonVariants, type ButtonProps } from './components/Button'
export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  type CardProps,
  type CardHeaderProps,
  type CardContentProps,
  type CardFooterProps,
} from './components/Card'
export {
  Avatar,
  AvatarGroup,
  avatarVariants,
  type AvatarProps,
  type AvatarGroupProps,
} from './components/Avatar'
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonListItem,
  SkeletonStatsCard,
  SkeletonPageHeader,
  SkeletonModuleOverview,
} from './components/Skeleton'
export { Tooltip } from './components/Tooltip'
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from './components/Table'
export { Dropdown, type DropdownOption } from './components/Dropdown'

// TanStack Data Table
export {
  DataTable,
  DataTable as TanstackDataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  DataTableFacetedFilter,
  DataTableViewOptions,
  DataTableRowActions,
  DataTableSkeleton,
  DataTableSkeleton as TanstackDataTableSkeleton,
  DataTableEmpty,
  useDataTable,
  createColumnHelper,
  createSelectColumn,
  createExpandColumn,
  createActionsColumn,
  type DataTableProps,
  type DataTableProps as TanstackDataTableProps,
  type DataTableEmptyStateConfig,
  type DataTableColumnMeta,
  type FacetedFilterOption,
  type FacetedFilterConfig,
  type BulkAction,
  type RowAction,
  type PaginationConfig,
  type ColumnDef,
  type Row,
  type CellContext,
  type HeaderContext,
} from './components/data-table'
export {
  Modal,
  ModalFooter,
  type ModalProps,
  type ModalFooterProps,
} from './components/Modal'
export {
  Drawer,
  DrawerFooter,
  type DrawerProps,
  type DrawerFooterProps,
} from './components/Drawer'

// i18n
export { LanguageSwitcher } from './components/LanguageSwitcher'

// Coming Soon
export {
  ComingSoonBadge,
  ComingSoonBanner,
  ComingSoonOverlay,
  type ComingSoonBadgeProps,
  type ComingSoonBannerProps,
  type ComingSoonOverlayProps,
} from './components/ComingSoon'

// Date
export { DateDisplay } from './components/DateDisplay'
export { BsDatePicker, DateInput } from './components/BsDatePicker'
export { SchoolDate } from './components/SchoolDate'

// V2 Components
export { StatCard, type StatCardProps } from './components/StatCard'
export { AnimatedProgressBar, type AnimatedProgressBarProps } from './components/AnimatedProgressBar'
export { WidgetErrorBoundaryV2 } from './components/SectionErrorBoundary'
export { V2AlertItem, type V2AlertItemProps } from './components/V2AlertItem'

// V2 Hooks
export { useCountUp, parseFormattedValue, formatAnimatedValue } from './hooks/useCountUp'
export { useV2ChartColors } from './hooks/useV2ChartColors'

