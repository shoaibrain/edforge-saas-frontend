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
export {
  DataTable,
  type Column,
  type DataTableProps,
  type DataTableEmptyState,
} from './components/DataTable'
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

