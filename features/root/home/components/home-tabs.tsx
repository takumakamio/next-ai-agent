'use client'


import { useCallback, useState } from 'react'
import { QaLogsTab } from '../../qa-logs/components/qa-logs-tab'
import { QasTab } from '../../qas/components/qas-tab'
import { BackgroundSelector } from './background-selector'
import { Chat } from './chat'

type TabKey = 'chat' | 'qas' | 'qa-logs'

export const HomeTabs = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('chat')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'chat', label: 'Chat' },
    { key: 'qas', label: 'QAs' },
    { key: 'qa-logs', label: 'QA Logs' },
  ]

  const handleQaEditFromLogs = useCallback((id: string) => {
    setActiveTab('qas')
  }, [])

  return (
    <div className="flex flex-col h-screen">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-6 py-3 text-sm font-black uppercase tracking-widest transition-colors rounded-t-lg
                ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="px-2">
          <BackgroundSelector />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'chat' && (
          <div className="h-full">
            <Chat />
          </div>
        )}
        {activeTab === 'qas' && <QasTab />}
        {activeTab === 'qa-logs' && <QaLogsTab onQaEditClick={handleQaEditFromLogs} />}
      </div>
    </div>
  )
}
