/**
 * Integrations Store
 * 
 * Zustand store for managing meeting platform integrations,
 * connection state, and scheduled meetings.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  MeetingPlatformId,
  ConnectedIntegration,
  ScheduledMeeting,
} from '../lib/meeting-integrations'
import {
  MOCK_CONNECTED_INTEGRATIONS,
  MOCK_SCHEDULED_MEETINGS,
} from '../lib/meeting-integrations'

// ============================================================================
// TYPES
// ============================================================================

export type WizardStep = 'select' | 'permissions' | 'connecting' | 'success' | 'error'

interface IntegrationsState {
  // Connected integrations
  connectedIntegrations: ConnectedIntegration[]
  
  // Scheduled meetings
  scheduledMeetings: ScheduledMeeting[]
  
  // Connection wizard state
  wizardOpen: boolean
  wizardStep: WizardStep
  selectedPlatform: MeetingPlatformId | null
  connectionError: string | null
  
  // Actions
  openWizard: (platformId?: MeetingPlatformId) => void
  closeWizard: () => void
  setWizardStep: (step: WizardStep) => void
  setSelectedPlatform: (platformId: MeetingPlatformId | null) => void
  
  // Integration management
  connectIntegration: (platformId: MeetingPlatformId, email: string) => Promise<void>
  disconnectIntegration: (platformId: MeetingPlatformId) => void
  refreshIntegration: (platformId: MeetingPlatformId) => Promise<void>
  
  // Meeting management
  addMeeting: (meeting: ScheduledMeeting) => void
  updateMeeting: (meetingId: string, updates: Partial<ScheduledMeeting>) => void
  removeMeeting: (meetingId: string) => void
  
  // Utility
  isConnected: (platformId: MeetingPlatformId) => boolean
  getIntegration: (platformId: MeetingPlatformId) => ConnectedIntegration | undefined
}

// ============================================================================
// STORE
// ============================================================================

export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set, get) => ({
      // Initial state - start with mock data for demo
      connectedIntegrations: MOCK_CONNECTED_INTEGRATIONS,
      scheduledMeetings: MOCK_SCHEDULED_MEETINGS,
      
      // Wizard state
      wizardOpen: false,
      wizardStep: 'select',
      selectedPlatform: null,
      connectionError: null,
      
      // ====================================================================
      // WIZARD ACTIONS
      // ====================================================================
      
      openWizard: (platformId) => {
        set({
          wizardOpen: true,
          wizardStep: platformId ? 'permissions' : 'select',
          selectedPlatform: platformId || null,
          connectionError: null,
        })
      },
      
      closeWizard: () => {
        set({
          wizardOpen: false,
          wizardStep: 'select',
          selectedPlatform: null,
          connectionError: null,
        })
      },
      
      setWizardStep: (step) => {
        set({ wizardStep: step })
      },
      
      setSelectedPlatform: (platformId) => {
        set({ selectedPlatform: platformId })
      },
      
      // ====================================================================
      // INTEGRATION MANAGEMENT
      // ====================================================================
      
      connectIntegration: async (platformId, email) => {
        set({ wizardStep: 'connecting' })
        
        // Simulate OAuth flow with a delay
        await new Promise((resolve) => setTimeout(resolve, 2000))
        
        // Simulate success (in real app, this would be an OAuth callback)
        const newIntegration: ConnectedIntegration = {
          platformId,
          connectedAt: new Date().toISOString(),
          accountEmail: email,
          status: 'connected',
          lastSync: new Date().toISOString(),
        }
        
        set((state) => ({
          connectedIntegrations: [
            ...state.connectedIntegrations.filter((i) => i.platformId !== platformId),
            newIntegration,
          ],
          wizardStep: 'success',
        }))
      },
      
      disconnectIntegration: (platformId) => {
        set((state) => ({
          connectedIntegrations: state.connectedIntegrations.filter(
            (i) => i.platformId !== platformId
          ),
        }))
      },
      
      refreshIntegration: async (platformId) => {
        // Simulate refresh
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        set((state) => ({
          connectedIntegrations: state.connectedIntegrations.map((i) =>
            i.platformId === platformId
              ? { ...i, lastSync: new Date().toISOString() }
              : i
          ),
        }))
      },
      
      // ====================================================================
      // MEETING MANAGEMENT
      // ====================================================================
      
      addMeeting: (meeting) => {
        set((state) => ({
          scheduledMeetings: [...state.scheduledMeetings, meeting],
        }))
      },
      
      updateMeeting: (meetingId, updates) => {
        set((state) => ({
          scheduledMeetings: state.scheduledMeetings.map((m) =>
            m.id === meetingId ? { ...m, ...updates } : m
          ),
        }))
      },
      
      removeMeeting: (meetingId) => {
        set((state) => ({
          scheduledMeetings: state.scheduledMeetings.filter((m) => m.id !== meetingId),
        }))
      },
      
      // ====================================================================
      // UTILITY
      // ====================================================================
      
      isConnected: (platformId) => {
        return get().connectedIntegrations.some(
          (i) => i.platformId === platformId && i.status === 'connected'
        )
      },
      
      getIntegration: (platformId) => {
        return get().connectedIntegrations.find((i) => i.platformId === platformId)
      },
    }),
    {
      name: 'edforge-integrations',
      partialize: (state) => ({
        connectedIntegrations: state.connectedIntegrations,
        scheduledMeetings: state.scheduledMeetings,
      }),
    }
  )
)

