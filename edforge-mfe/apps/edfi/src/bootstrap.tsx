/**
 * Ed-Fi Module Bootstrap
 *
 * Entry point for the Ed-Fi federated module.
 * Can be loaded standalone or integrated into the Shell.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cloud, Link, Map, Activity, AlertTriangle } from 'lucide-react'
import { ConnectionWizard } from './components/connection/ConnectionWizard'
import { DescriptorMapper } from './components/mapping/DescriptorMapper'
import { SyncDashboard } from './components/sync/SyncDashboard'
import { ErrorAggregator } from './components/errors/ErrorAggregator'

type EdFiTab = 'connection' | 'mapping' | 'sync' | 'errors'

const TABS = [
  { id: 'connection' as const, label: 'Connection', icon: Link },
  { id: 'mapping' as const, label: 'Descriptor Mapping', icon: Map },
  { id: 'sync' as const, label: 'Sync Status', icon: Activity },
  { id: 'errors' as const, label: 'Error Insights', icon: AlertTriangle },
]

export function EdFiModule() {
  const [activeTab, setActiveTab] = useState<EdFiTab>('connection')

  const renderContent = () => {
    switch (activeTab) {
      case 'connection':
        return <ConnectionWizard />
      case 'mapping':
        return <DescriptorMapper />
      case 'sync':
        return <SyncDashboard />
      case 'errors':
        return <ErrorAggregator />
    }
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <div className="bg-surface-secondary border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500">
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Ed-Fi Integration</h1>
              <p className="text-text-secondary">
                Manage ODS connections, descriptor mappings, and data synchronization
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-t-xl border-b-2 transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? 'bg-surface-primary border-teal-500 text-teal-600 dark:text-cyan-400'
                      : 'border-transparent text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.id === 'errors' && (
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-rust-500/20 text-rust-500">
                    105
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  )
}

export default EdFiModule

