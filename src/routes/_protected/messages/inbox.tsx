/**
 * Messages Inbox Page
 * 
 * Direct messaging interface with:
 * - Conversation list
 * - Message threads
 * - Compose new message
 * - Search and filter
 */

import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Mail,
    Plus,
    Search,
    Send,
    Paperclip,
    Star,
    StarOff,
    Archive,
    Trash2,
    CheckCheck,
} from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export const Route = createFileRoute('/_protected/messages/inbox')({
    beforeLoad: () => {
        const { user } = useAuthStore.getState()
        const { activeSchoolId } = useAppStore.getState()

        if (!can(user, { action: 'view', resource: 'staff', schoolId: activeSchoolId ?? undefined })) {
            throw redirect({ to: '/forbidden' })
        }
    },
    component: MessagesInboxPage,
})

// Mock conversations data
const MOCK_CONVERSATIONS = [
    {
        id: 'conv-001',
        participant: { name: 'Robert Thompson', role: 'Parent', avatar: null },
        subject: 'Question about homework assignment',
        lastMessage: 'Thank you for the clarification. Emma will submit it by tomorrow.',
        timestamp: '2024-03-15T16:30:00',
        unread: false,
        starred: true,
    },
    {
        id: 'conv-002',
        participant: { name: 'Dr. Sarah Mitchell', role: 'Teacher', avatar: null },
        subject: 'Lab equipment request',
        lastMessage: 'I have submitted the purchase order. Should arrive next week.',
        timestamp: '2024-03-15T14:15:00',
        unread: true,
        starred: false,
    },
    {
        id: 'conv-003',
        participant: { name: 'Jennifer Adams', role: 'Office Manager', avatar: null },
        subject: 'Staff meeting agenda',
        lastMessage: 'Please review the attached agenda for Friday\'s meeting.',
        timestamp: '2024-03-15T11:45:00',
        unread: true,
        starred: false,
    },
    {
        id: 'conv-004',
        participant: { name: 'Michael Chen', role: 'Parent', avatar: null },
        subject: 'Field trip permission form',
        lastMessage: 'We have signed and returned the permission slip.',
        timestamp: '2024-03-14T09:20:00',
        unread: false,
        starred: false,
    },
    {
        id: 'conv-005',
        participant: { name: 'Academic Office', role: 'Department', avatar: null },
        subject: 'Grade submission deadline',
        lastMessage: 'Reminder: All grades must be submitted by Friday.',
        timestamp: '2024-03-13T15:00:00',
        unread: false,
        starred: true,
    },
]

// Mock messages for selected conversation
const MOCK_MESSAGES = [
    {
        id: 'msg-001',
        sender: 'Robert Thompson',
        content: 'Good afternoon! I wanted to ask about the math homework that was assigned today.',
        timestamp: '2024-03-15T14:00:00',
        isOwn: false,
        status: 'read',
    },
    {
        id: 'msg-002',
        sender: 'You',
        content: 'Hi Mr. Thompson! Of course, how can I help you?',
        timestamp: '2024-03-15T14:30:00',
        isOwn: true,
        status: 'read',
    },
    {
        id: 'msg-003',
        sender: 'Robert Thompson',
        content: 'Emma mentioned that she\'s having trouble with problem #5 on the worksheet. Could you provide some guidance?',
        timestamp: '2024-03-15T15:00:00',
        isOwn: false,
        status: 'read',
    },
    {
        id: 'msg-004',
        sender: 'You',
        content: 'Absolutely! For problem #5, start by identifying the variables first. The key is to set up the equation based on the word problem. I\'ll also post some additional resources in the class portal.',
        timestamp: '2024-03-15T15:45:00',
        isOwn: true,
        status: 'read',
    },
    {
        id: 'msg-005',
        sender: 'Robert Thompson',
        content: 'Thank you for the clarification. Emma will submit it by tomorrow.',
        timestamp: '2024-03-15T16:30:00',
        isOwn: false,
        status: 'read',
    },
]

// ============================================================================
// CONVERSATION ITEM
// ============================================================================

function ConversationItem({
    conversation,
    isSelected,
    onClick,
}: {
    conversation: typeof MOCK_CONVERSATIONS[0]
    isSelected: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-4 border-b border-[rgb(var(--border-secondary))] transition-colors ${isSelected
                ? 'bg-teal-500/10 dark:bg-cyan-500/10'
                : 'hover:bg-[rgb(var(--interactive-hover))]'
                }`}
        >
            <div className="flex items-start gap-3">
                <div className="relative">
                    <Avatar name={conversation.participant.name} size="md" />
                    {conversation.unread && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-teal-500 dark:bg-cyan-500 rounded-full border-2 border-[rgb(var(--surface-secondary))]" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-medium truncate ${conversation.unread ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-secondary))]'}`}>
                            {conversation.participant.name}
                        </span>
                        <span className="text-xs text-[rgb(var(--text-tertiary))] whitespace-nowrap">
                            {new Date(conversation.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                    <p className={`text-sm truncate ${conversation.unread ? 'font-medium text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-tertiary))]'}`}>
                        {conversation.subject}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))] truncate mt-0.5">
                        {conversation.lastMessage}
                    </p>
                </div>
                {conversation.starred && (
                    <Star className="w-4 h-4 text-golden-500 fill-golden-500 flex-shrink-0" />
                )}
            </div>
        </button>
    )
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

function MessageBubble({ message }: { message: typeof MOCK_MESSAGES[0] }) {
    return (
        <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] ${message.isOwn ? 'order-2' : 'order-1'}`}>
                {!message.isOwn && (
                    <p className="text-xs text-[rgb(var(--text-tertiary))] mb-1 ml-1">
                        {message.sender}
                    </p>
                )}
                <div className={`px-4 py-3 rounded-2xl ${message.isOwn
                    ? 'bg-teal-500 dark:bg-cyan-600 text-white rounded-br-md'
                    : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-primary))] rounded-bl-md'
                    }`}>
                    <p className="text-sm">{message.content}</p>
                </div>
                <div className={`flex items-center gap-1 mt-1 ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">
                        {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {message.isOwn && (
                        <CheckCheck className="w-3.5 h-3.5 text-teal-500 dark:text-cyan-400" />
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function MessagesInboxPage() {
    const [selectedConversation, setSelectedConversation] = useState<string | null>('conv-001')
    const [searchQuery, setSearchQuery] = useState('')
    const [messageInput, setMessageInput] = useState('')

    const filteredConversations = MOCK_CONVERSATIONS.filter(conv =>
        conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.subject.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const currentConversation = MOCK_CONVERSATIONS.find(c => c.id === selectedConversation)

    return (
        <div className="h-[calc(100vh-180px)] flex flex-col">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-4"
            >
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
                        Inbox
                    </h1>
                    <p className="text-[rgb(var(--text-secondary))] mt-1">
                        Direct communication with parents and staff
                    </p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Message
                </Button>
            </motion.div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 flex gap-4 min-h-0"
            >
                {/* Conversations List */}
                <Card className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-[rgb(var(--border-secondary))]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-secondary))] rounded-lg text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all"
                            />
                        </div>
                    </div>

                    {/* Conversations */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.map((conv) => (
                            <ConversationItem
                                key={conv.id}
                                conversation={conv}
                                isSelected={selectedConversation === conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                            />
                        ))}
                    </div>
                </Card>

                {/* Message Thread */}
                <Card className="flex-1 flex flex-col overflow-hidden">
                    {selectedConversation && currentConversation ? (
                        <>
                            {/* Thread Header */}
                            <div className="p-4 border-b border-[rgb(var(--border-secondary))] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar name={currentConversation.participant.name} size="md" />
                                    <div>
                                        <p className="font-semibold text-[rgb(var(--text-primary))]">
                                            {currentConversation.participant.name}
                                        </p>
                                        <p className="text-xs text-[rgb(var(--text-tertiary))]">
                                            {currentConversation.participant.role}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm">
                                        {currentConversation.starred ? (
                                            <Star className="w-4 h-4 text-golden-500 fill-golden-500" />
                                        ) : (
                                            <StarOff className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Archive className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {MOCK_MESSAGES.map((message) => (
                                    <MessageBubble key={message.id} message={message} />
                                ))}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-[rgb(var(--border-secondary))]">
                                <div className="flex items-end gap-3">
                                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                                        <Paperclip className="w-4 h-4" />
                                    </Button>
                                    <div className="flex-1">
                                        <textarea
                                            placeholder="Type a message..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            rows={1}
                                            className="w-full px-4 py-2.5 text-sm bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-secondary))] rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none"
                                        />
                                    </div>
                                    <Button size="sm" className="flex-shrink-0">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <Mail className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-50" />
                                <p className="text-lg font-medium text-[rgb(var(--text-secondary))]">
                                    Select a conversation
                                </p>
                                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                                    Choose a conversation from the list to view messages
                                </p>
                            </div>
                        </div>
                    )}
                </Card>
            </motion.div>
        </div>
    )
}
