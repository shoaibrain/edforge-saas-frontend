/**
 * Classwork Types
 *
 * Local aliases that match @aibrains/shared-types classwork DTOs.
 * We re-export from shared-types for canonical usage, and keep
 * lightweight aliases here for component-level convenience.
 */

export type {
  ClassworkItemType,
  ClassworkItemStatus,
  ClassworkAssessmentCategory,
  ClassworkAttachmentDto as ClassworkAttachment,
  ClassworkItemResponseDto as ClassworkItem,
  ClassworkTopicResponseDto as ClassworkTopic,
  SectionClassworkResponseDto,
  CreateClassworkItemDto,
  UpdateClassworkItemDto,
  CreateClassworkTopicDto,
  UpdateClassworkTopicDto,
  ReorderClassworkItemsDto,
} from '@aibrains/shared-types'
