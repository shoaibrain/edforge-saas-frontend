/**
 * Descriptor Mapping Studio
 *
 * Split-view interface for mapping local codes to Ed-Fi Descriptors.
 * This is the most critical UI for Ed-Fi certification.
 *
 * Features:
 * - Split view: Local codes on left, Ed-Fi descriptors on right
 * - Searchable/autocomplete dropdown for Ed-Fi descriptors
 * - Visual indicators for mapped vs unmapped codes
 * - Bulk mapping suggestions
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Check,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Save,
  Filter,
} from 'lucide-react'
import { Button, Card, CardContent, CardHeader } from '@edforge/ui'

// ============================================================================
// TYPES
// ============================================================================

interface LocalCode {
  id: string
  code: string
  description: string
  category: string
  edfiDescriptor?: string
  isAutoMapped?: boolean
}

interface EdFiDescriptor {
  uri: string
  namespace: string
  codeValue: string
  shortDescription: string
  description: string
}

interface MappingCategory {
  id: string
  name: string
  localCodes: LocalCode[]
  edfiDescriptors: EdFiDescriptor[]
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CATEGORIES: MappingCategory[] = [
  {
    id: 'gender',
    name: 'Gender',
    localCodes: [
      { id: '1', code: 'M', description: 'Male', category: 'gender', edfiDescriptor: 'uri://ed-fi.org/SexDescriptor#Male' },
      { id: '2', code: 'F', description: 'Female', category: 'gender', edfiDescriptor: 'uri://ed-fi.org/SexDescriptor#Female' },
      { id: '3', code: 'X', description: 'Non-Binary', category: 'gender' },
    ],
    edfiDescriptors: [
      { uri: 'uri://ed-fi.org/SexDescriptor#Male', namespace: 'ed-fi.org', codeValue: 'Male', shortDescription: 'Male', description: 'A person identifying as male' },
      { uri: 'uri://ed-fi.org/SexDescriptor#Female', namespace: 'ed-fi.org', codeValue: 'Female', shortDescription: 'Female', description: 'A person identifying as female' },
      { uri: 'uri://ed-fi.org/SexDescriptor#Not Selected', namespace: 'ed-fi.org', codeValue: 'Not Selected', shortDescription: 'Not Selected', description: 'Not selected' },
    ],
  },
  {
    id: 'grade',
    name: 'Grade Level',
    localCodes: [
      { id: '4', code: 'K', description: 'Kindergarten', category: 'grade', edfiDescriptor: 'uri://ed-fi.org/GradeLevelDescriptor#Kindergarten' },
      { id: '5', code: '01', description: 'First Grade', category: 'grade' },
      { id: '6', code: '02', description: 'Second Grade', category: 'grade' },
      { id: '7', code: '03', description: 'Third Grade', category: 'grade' },
      { id: '8', code: '04', description: 'Fourth Grade', category: 'grade' },
      { id: '9', code: '05', description: 'Fifth Grade', category: 'grade' },
    ],
    edfiDescriptors: [
      { uri: 'uri://ed-fi.org/GradeLevelDescriptor#Kindergarten', namespace: 'ed-fi.org', codeValue: 'Kindergarten', shortDescription: 'Kindergarten', description: 'Kindergarten' },
      { uri: 'uri://ed-fi.org/GradeLevelDescriptor#First grade', namespace: 'ed-fi.org', codeValue: 'First grade', shortDescription: 'First Grade', description: 'First Grade' },
      { uri: 'uri://ed-fi.org/GradeLevelDescriptor#Second grade', namespace: 'ed-fi.org', codeValue: 'Second grade', shortDescription: 'Second Grade', description: 'Second Grade' },
      { uri: 'uri://ed-fi.org/GradeLevelDescriptor#Third grade', namespace: 'ed-fi.org', codeValue: 'Third grade', shortDescription: 'Third Grade', description: 'Third Grade' },
      { uri: 'uri://ed-fi.org/GradeLevelDescriptor#Fourth grade', namespace: 'ed-fi.org', codeValue: 'Fourth grade', shortDescription: 'Fourth Grade', description: 'Fourth Grade' },
      { uri: 'uri://ed-fi.org/GradeLevelDescriptor#Fifth grade', namespace: 'ed-fi.org', codeValue: 'Fifth grade', shortDescription: 'Fifth Grade', description: 'Fifth Grade' },
    ],
  },
  {
    id: 'attendance',
    name: 'Attendance Event',
    localCodes: [
      { id: '10', code: 'P', description: 'Present', category: 'attendance' },
      { id: '11', code: 'A', description: 'Absent', category: 'attendance' },
      { id: '12', code: 'T', description: 'Tardy', category: 'attendance' },
      { id: '13', code: 'E', description: 'Excused', category: 'attendance' },
    ],
    edfiDescriptors: [
      { uri: 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#In Attendance', namespace: 'ed-fi.org', codeValue: 'In Attendance', shortDescription: 'In Attendance', description: 'Present' },
      { uri: 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Unexcused Absence', namespace: 'ed-fi.org', codeValue: 'Unexcused Absence', shortDescription: 'Unexcused Absence', description: 'Absent without excuse' },
      { uri: 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Excused Absence', namespace: 'ed-fi.org', codeValue: 'Excused Absence', shortDescription: 'Excused Absence', description: 'Absent with excuse' },
      { uri: 'uri://ed-fi.org/AttendanceEventCategoryDescriptor#Tardy', namespace: 'ed-fi.org', codeValue: 'Tardy', shortDescription: 'Tardy', description: 'Late arrival' },
    ],
  },
]

// ============================================================================
// DESCRIPTOR MAPPER COMPONENT
// ============================================================================

export function DescriptorMapper() {
  const [selectedCategory, setSelectedCategory] = useState(MOCK_CATEGORIES[0])
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    // Initialize with existing mappings
    const initial: Record<string, string> = {}
    MOCK_CATEGORIES.forEach((cat) => {
      cat.localCodes.forEach((code) => {
        if (code.edfiDescriptor) {
          initial[code.id] = code.edfiDescriptor
        }
      })
    })
    return initial
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showUnmappedOnly, setShowUnmappedOnly] = useState(false)

  // Calculate mapping stats
  const stats = useMemo(() => {
    const total = selectedCategory.localCodes.length
    const mapped = selectedCategory.localCodes.filter((c) => mappings[c.id]).length
    return { total, mapped, unmapped: total - mapped }
  }, [selectedCategory, mappings])

  // Filter local codes
  const filteredCodes = useMemo(() => {
    let codes = selectedCategory.localCodes
    if (showUnmappedOnly) {
      codes = codes.filter((c) => !mappings[c.id])
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      codes = codes.filter(
        (c) =>
          c.code.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term)
      )
    }
    return codes
  }, [selectedCategory, mappings, showUnmappedOnly, searchTerm])

  const handleMap = (localCodeId: string, edfiUri: string) => {
    setMappings((prev) => ({ ...prev, [localCodeId]: edfiUri }))
  }

  const handleUnmap = (localCodeId: string) => {
    setMappings((prev) => {
      const next = { ...prev }
      delete next[localCodeId]
      return next
    })
  }

  const handleAutoMap = () => {
    // Simulate auto-mapping with AI/fuzzy matching
    const newMappings: Record<string, string> = { ...mappings }
    selectedCategory.localCodes.forEach((code) => {
      if (!newMappings[code.id]) {
        // Find best match (simplified - in production use AI/fuzzy matching)
        const match = selectedCategory.edfiDescriptors.find(
          (d) =>
            d.shortDescription.toLowerCase().includes(code.description.toLowerCase()) ||
            d.codeValue.toLowerCase().includes(code.description.toLowerCase())
        )
        if (match) {
          newMappings[code.id] = match.uri
        }
      }
    })
    setMappings(newMappings)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Descriptor Mapping Studio</h1>
          <p className="text-text-secondary">Map your local codes to Ed-Fi standard descriptors</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleAutoMap}>
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Map
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Mappings
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {MOCK_CATEGORIES.map((category) => {
          const catMapped = category.localCodes.filter((c) => mappings[c.id]).length
          const catTotal = category.localCodes.length
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200
                ${
                  selectedCategory.id === category.id
                    ? 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--action-secondary-fg))] border-2 border-[rgb(var(--border-focus))]'
                    : 'bg-surface-tertiary text-text-secondary border-2 border-transparent hover:border-border-primary'
                }
              `}
            >
              <span className="font-medium">{category.name}</span>
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-medium
                  ${
                    catMapped === catTotal
                      ? 'bg-aqua-500/20 text-aqua-600'
                      : 'bg-golden-500/20 text-golden-600'
                  }
                `}
              >
                {catMapped}/{catTotal}
              </span>
            </button>
          )
        })}
      </div>

      {/* Stats Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.mapped}</p>
                <p className="text-sm text-aqua-600">Mapped</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.unmapped}</p>
                <p className="text-sm text-golden-600">Unmapped</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                <p className="text-sm text-text-tertiary">Total</p>
              </div>
            </div>
            <div className="w-64">
              <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[rgb(var(--action-primary-bg))] to-[rgb(var(--action-primary-bg-hover))]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.mapped / stats.total) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-text-tertiary mt-1 text-right">
                {Math.round((stats.mapped / stats.total) * 100)}% Complete
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search local codes..."
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => setShowUnmappedOnly(!showUnmappedOnly)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200
            ${
              showUnmappedOnly
                ? 'bg-golden-500/10 text-golden-600 border-2 border-golden-500'
                : 'bg-surface-tertiary text-text-secondary border-2 border-transparent hover:border-border-primary'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          Unmapped Only
        </button>
      </div>

      {/* Split View Mapping Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Local Codes */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-text-primary">Local Codes</h3>
          </CardHeader>
          <CardContent className="p-0 max-h-128 overflow-y-auto">
            <div className="divide-y divide-border-primary">
              {filteredCodes.map((code) => (
                <LocalCodeRow
                  key={code.id}
                  code={code}
                  isMapped={!!mappings[code.id]}
                  mappedTo={
                    mappings[code.id]
                      ? selectedCategory.edfiDescriptors.find(
                          (d) => d.uri === mappings[code.id]
                        )
                      : undefined
                  }
                  descriptors={selectedCategory.edfiDescriptors}
                  onMap={(uri) => handleMap(code.id, uri)}
                  onUnmap={() => handleUnmap(code.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Ed-Fi Descriptors Reference */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-text-primary">Ed-Fi Descriptors</h3>
          </CardHeader>
          <CardContent className="p-0 max-h-128 overflow-y-auto">
            <div className="divide-y divide-border-primary">
              {selectedCategory.edfiDescriptors.map((descriptor) => {
                const usedBy = selectedCategory.localCodes.filter(
                  (c) => mappings[c.id] === descriptor.uri
                )
                return (
                  <div
                    key={descriptor.uri}
                    className="p-4 hover:bg-surface-tertiary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-text-primary">{descriptor.shortDescription}</p>
                        <p className="text-sm text-text-tertiary">{descriptor.description}</p>
                        <code className="text-xs text-[rgb(var(--state-info-fg))] bg-[rgb(var(--state-info-bg)/0.18)] px-2 py-0.5 rounded mt-1 inline-block">
                          {descriptor.codeValue}
                        </code>
                      </div>
                      {usedBy.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-aqua-500/20 text-aqua-600">
                          {usedBy.length} mapped
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// LOCAL CODE ROW COMPONENT
// ============================================================================

interface LocalCodeRowProps {
  code: LocalCode
  isMapped: boolean
  mappedTo?: EdFiDescriptor
  descriptors: EdFiDescriptor[]
  onMap: (uri: string) => void
  onUnmap: () => void
}

function LocalCodeRow({
  code,
  isMapped,
  mappedTo,
  descriptors,
  onMap,
  onUnmap,
}: LocalCodeRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredDescriptors = useMemo(() => {
    if (!search) return descriptors
    const term = search.toLowerCase()
    return descriptors.filter(
      (d) =>
        d.shortDescription.toLowerCase().includes(term) ||
        d.codeValue.toLowerCase().includes(term)
    )
  }, [descriptors, search])

  return (
    <div
      className={`
        p-4 transition-colors
        ${isMapped ? 'bg-aqua-500/5' : 'bg-golden-500/5'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold
              ${isMapped ? 'bg-aqua-500/20 text-aqua-600' : 'bg-golden-500/20 text-golden-600'}
            `}
          >
            {code.code}
          </div>
          <div>
            <p className="font-medium text-text-primary">{code.description}</p>
            {isMapped && mappedTo && (
              <p className="text-sm text-aqua-600">→ {mappedTo.shortDescription}</p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
              ${
                isMapped
                  ? 'bg-aqua-500/10 text-aqua-600 hover:bg-aqua-500/20'
                  : 'bg-surface-tertiary text-text-secondary hover:bg-surface-elevated'
              }
            `}
          >
            {isMapped ? (
              <>
                <Check className="w-4 h-4" />
                Mapped
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                Select Mapping
              </>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-surface-secondary border border-border-primary rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-border-primary">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search descriptors..."
                        className="input pl-9 py-2 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {isMapped && (
                      <button
                        onClick={() => {
                          onUnmap()
                          setIsOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-rust-500 hover:bg-rust-500/10 transition-colors border-b border-border-primary"
                      >
                        Remove Mapping
                      </button>
                    )}
                    {filteredDescriptors.map((descriptor) => (
                      <button
                        key={descriptor.uri}
                        onClick={() => {
                          onMap(descriptor.uri)
                          setIsOpen(false)
                        }}
                        className={`
                          w-full px-4 py-3 text-left hover:bg-surface-tertiary transition-colors
                          ${mappedTo?.uri === descriptor.uri ? 'bg-[rgb(var(--state-info-bg)/0.18)]' : ''}
                        `}
                      >
                        <p className="font-medium text-text-primary">
                          {descriptor.shortDescription}
                        </p>
                        <code className="text-xs text-text-tertiary">
                          {descriptor.codeValue}
                        </code>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default DescriptorMapper

