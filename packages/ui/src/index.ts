/**
 * @edforge/ui
 *
 * Shared UI component library for the EdForge EMIS platform.
 * Built with React, Tailwind CSS, and class-variance-authority.
 */

// Utilities
export { cn, focusRing, focusRingInset, getUserAvatar } from './utils'

// Components
export { Button, buttonVariants, type ButtonProps } from './components/Button'
export { IconButton, type IconButtonProps } from './components/IconButton'
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
  IdentityCell,
  type IdentityCellProps,
} from './components/IdentityCell'
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
export { FieldLockTooltip, type FieldLockTooltipProps } from './components/FieldLockTooltip'
export { FieldLockIcon, type FieldLockIconProps } from './components/FieldLockIcon'
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
export { Tag, tagVariants, type TagProps } from './components/Tag'
export {
  StatusBadge,
  statusBadgeVariants,
  type StatusBadgeProps,
  type StatusTone,
} from './components/StatusBadge'
export { Accordion, type AccordionItem, type AccordionProps } from './components/Accordion'
export { Container, containerVariants, type ContainerProps } from './components/layout/Container'
export { Inline, inlineVariants, type InlineProps } from './components/layout/Inline'
export { PageShell, pageShellVariants, type PageShellProps } from './components/layout/PageShell'
export {
  PageHeader,
  type PageHeaderProps,
  type PageHeaderAction,
  type PageHeaderTitledProps,
  type PageHeaderPagebarProps,
  type PageHeaderGreetingProps,
} from './components/layout/PageHeader'
export {
  ContextBar,
  ContextBarSep,
  ContextBarYear,
  type ContextBarProps,
} from './components/layout/ContextBar'
export { SectionCard, type SectionCardProps } from './components/layout/SectionCard'
export { Stack, stackVariants, type StackProps } from './components/layout/Stack'
export { Heading, headingVariants, type HeadingProps } from './components/typography/Heading'
export { Text, textVariants, type TextProps } from './components/typography/Text'
export {
  Field,
  FormField,
  Checkbox,
  CheckboxField,
  Combobox,
  GradeRangeField,
  Input,
  RadioGroup,
  RadioGroupField,
  Select,
  Switch,
  SwitchField,
  Textarea,
  checkboxBoxVariants,
  comboboxInputVariants,
  comboboxShellVariants,
  inputElementVariants,
  inputShellVariants,
  selectButtonVariants,
  textareaVariants,
  useFieldContext,
  type CheckboxFieldProps,
  type CheckboxProps,
  type ComboboxProps,
  type FieldContextValue,
  type FieldProps,
  type GradeRangeFieldProps,
  type InputProps,
  type RadioGroupFieldProps,
  type RadioGroupProps,
  type RadioOption,
  type SelectOption,
  type SelectProps,
  type SwitchFieldProps,
  type SwitchProps,
  type TextareaProps,
} from './components/forms'
export {
  EmptyState,
  ErrorState,
  InlineAlert,
  LoadingState,
  type EmptyStateProps,
  type ErrorStateProps,
  type InlineAlertProps,
  type InlineAlertVariant,
  type LoadingStateProps,
} from './components/states'
export { Tabs, SegmentedControl, type TabItem, type TabsProps } from './components/Tabs'

// TanStack Data Table
export {
  DataTable,
  DataTable as TanstackDataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  ToolbarSearch,
  type ToolbarSearchProps,
  DataTableFacetedFilter,
  DataTableViewOptions,
  DataTableRowActions,
  DataTableSkeleton,
  DataTableSkeleton as TanstackDataTableSkeleton,
  DataTableEmpty,
  DataTableDensityToggle,
  DataTableExport,
  TablePresetTabs,
  TableBulkBar,
  DataTableMoreFilters,
  type TablePreset,
  type TablePresetTabsProps,
  type TableBulkBarProps,
  type DataTableMoreFiltersProps,
  DEFAULT_DATA_TABLE_LABELS,
  resolveDataTableLabels,
  useDataTable,
  readPersistedTableState,
  usePersistTableState,
  clearPersistedTableState,
  createColumnHelper,
  createSelectColumn,
  createExpandColumn,
  createActionsColumn,
  type DataTableProps,
  type DataTableProps as TanstackDataTableProps,
  type DataTableEmptyStateConfig,
  type DataTableColumnMeta,
  type DataTableDensity,
  type DataTableExportOptions,
  type DataTableExportFormat,
  type DataTableLabels,
  type DataTableLabelsInput,
  type FacetedFilterOption,
  type FacetedFilterConfig,
  type BulkAction,
  type RowAction,
  type PaginationConfig,
  type ServerPaginationConfig,
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

// Date
export { DateDisplay } from './components/DateDisplay'
export { BsDatePicker, DateInput } from './components/BsDatePicker'
export { SchoolDate } from './components/SchoolDate'

// Portal Primitives
export { ContentSection, type ContentSectionProps } from './components/ContentSection'
export { DashedDivider, type DashedDividerProps } from './components/DashedDivider'
export { StatusPill, type StatusPillProps, type StatusPillVariant } from './components/StatusPill'
export { StatStrip, type StatStripProps, type StatStripItem } from './components/StatStrip'
export {
  StatBand,
  type StatBandProps,
  type StatMetric,
  type StatBandState,
  type StatBandPillTone,
  type IconName,
} from './components/StatBand'
export { Ring, type RingProps } from './components/Ring'
export { GpaRing, type GpaRingProps, type GpaRingSize } from './components/GpaRing'
export { CategoryBar, type CategoryBarProps } from './components/CategoryBar'
export { CourseCard, type CourseCardProps, type CourseCardCategory } from './components/CourseCard'
export {
  AttendanceHeatmap,
  type AttendanceHeatmapProps,
  type HeatmapDay,
  type HeatmapStatus,
} from './components/AttendanceHeatmap'
export {
  WeekTimetable,
  type WeekTimetableProps,
  type TimetableSlot,
  type TimetableClassBlock,
} from './components/WeekTimetable'
export { FilterTabs, type FilterTabsProps, type FilterTab } from './components/FilterTabs'

// V2 Components
export { StatCard, type StatCardProps } from './components/StatCard'
export { AnimatedProgressBar, type AnimatedProgressBarProps } from './components/AnimatedProgressBar'
export { WidgetErrorBoundaryV2 } from './components/SectionErrorBoundary'
export { V2AlertItem, type V2AlertItemProps } from './components/V2AlertItem'

// Dashboard recipes (⑤ WidgetCard — ④ AlertLane retired in favor of the
// Header Zone AttentionCorner; DashboardLayout deleted with it)
export {
  WidgetCard,
  WidgetGrid,
  type WidgetCardProps,
  type WidgetSpan,
  type WidgetState,
} from './components/dashboard'

// V2 Hooks
export { useCountUp, parseFormattedValue, formatAnimatedValue } from './hooks/useCountUp'
export { useV2ChartColors } from './hooks/useV2ChartColors'
export { useMediaQuery } from './hooks/useMediaQuery'

// V2 Shared Components
export {
  AttendanceDonutRing,
  type AttendanceDonutRingProps,
} from './components/AttendanceDonutRing'
export {
  AttendanceTrend,
  type AttendanceTrendProps,
  type AttendanceTrendDirection,
} from './components/AttendanceTrend'
export {
  QuickDrawer,
  useQuickDrawer,
  type QuickDrawerRootProps,
  type QuickDrawerHeaderProps,
  type QuickDrawerBodyProps,
  type QuickDrawerFooterProps,
} from './components/QuickDrawer'

// Header Zone (⑧ AttentionCorner · ⑨ SelectionContextBar)
export {
  AttentionCorner,
  AttentionCornerPill,
  AttentionCornerShade,
  SelectionContextBar,
  DEFAULT_ATTENTION_LABELS,
  DEFAULT_SELECTION_LABELS,
  type AttentionCornerProps,
  type AttentionCornerLabels,
  type Signal,
  type SignalSeverity,
  type SelectionContextBarProps,
  type SelectionContextBarLabels,
  type SelectionAction,
} from './components/header-zone'

// Hooks
export { useFocusTrap } from './hooks/useFocusTrap'
export { useSignalAcks } from './hooks/useSignalAcks'

// MFE infrastructure
export {
  MfeNotFoundBoundary,
  type MfeNotFoundBoundaryProps,
} from './components/MfeNotFoundBoundary'
