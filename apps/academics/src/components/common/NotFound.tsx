/**
 * NotFound Component
 *
 * Custom 404 page for the Academics module.
 * Displays a friendly error message when a route or resource is not found.
 *
 * Features:
 * - Clean, modern design consistent with the app's visual language
 * - Clear messaging about what went wrong
 * - Navigation options to help users recover
 * - Support for different not-found scenarios (page vs resource)
 */

import { Link } from '@tanstack/react-router'
import { FileQuestion, ArrowLeft, Home, Users } from 'lucide-react'
import { Button } from '@edforge/ui'

// ============================================================================
// TYPES
// ============================================================================

export interface NotFoundProps {
  /**
   * Type of resource that was not found
   * @default 'page'
   */
  type?: 'page' | 'student' | 'course' | 'section' | 'resource'
  /**
   * Optional custom title
   */
  title?: string
  /**
   * Optional custom message
   */
  message?: string
  /**
   * Whether to show the back button
   * @default true
   */
  showBackButton?: boolean
  /**
   * Custom back URL (defaults to browser back)
   */
  backUrl?: string
}

// ============================================================================
// DEFAULT MESSAGES
// ============================================================================

const defaultMessages: Record<NonNullable<NotFoundProps['type']>, { title: string; message: string }> = {
  page: {
    title: 'Page Not Found',
    message: "The page you're looking for doesn't exist or has been moved.",
  },
  student: {
    title: 'Student Not Found',
    message: "This student record doesn't exist or you may not have permission to view it.",
  },
  course: {
    title: 'Course Not Found',
    message: "This course doesn't exist or has been removed from the catalog.",
  },
  section: {
    title: 'Section Not Found',
    message: "This class section doesn't exist or has been removed.",
  },
  resource: {
    title: 'Resource Not Found',
    message: "The requested resource doesn't exist or has been moved.",
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

export function NotFound({
  type = 'page',
  title,
  message,
  showBackButton = true,
  backUrl,
}: NotFoundProps) {
  const defaultContent = defaultMessages[type]
  const displayTitle = title || defaultContent.title
  const displayMessage = message || defaultContent.message

  const handleGoBack = () => {
    if (backUrl) {
      window.location.href = backUrl
    } else {
      window.history.back()
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[rgb(var(--background-tertiary))] to-[rgb(var(--background-secondary))] flex items-center justify-center">
          <FileQuestion className="w-10 h-10 text-[rgb(var(--text-tertiary))]" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-text-primary mb-3">
          {displayTitle}
        </h1>

        {/* Message */}
        <p className="text-text-secondary mb-8 leading-relaxed">
          {displayMessage}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {showBackButton && (
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}

          {type === 'student' ? (
            <Link to="/students">
              <Button className="w-full sm:w-auto">
                <Users className="w-4 h-4 mr-2" />
                Student Directory
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Academics Home
              </Button>
            </Link>
          )}
        </div>

        {/* Error code */}
        <p className="mt-8 text-sm text-text-tertiary">
          Error 404 • {type === 'page' ? 'Page' : 'Resource'} not found
        </p>
      </div>
    </div>
  )
}
