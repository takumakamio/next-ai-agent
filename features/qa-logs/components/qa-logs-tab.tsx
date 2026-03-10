'use client'

import { ManageQaLogTable } from '@/features/qa-logs/components/table'
import type { SelectQaLog } from '@/features/qa-logs/schema'
import { rpc } from '@/lib/rpc'
import { ScrollText } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface QaLogsTabProps {
  onQaEditClick?: (id: string) => void
}

export const QaLogsTab = ({ onQaEditClick }: QaLogsTabProps) => {
  const [data, setData] = useState<SelectQaLog[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await rpc.api['qa-logs'].$get({
        query: {
          page,
          limit: 50,
          ...(search && { search }),
        },
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const response = await res.json()
      setData(response.data)
      setMeta(response.meta)
    } catch (error) {
      console.error('Failed to fetch QA Logs:', error)
      toast('Failed to fetch QA Logs')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="p-4">
      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <ManageQaLogTable
          data={data}
          meta={meta}
          dataKey="qa-logs"
          header={
            <div className="flex items-center gap-3">
              <ScrollText className="size-7" />
              <h1 className="text-2xl font-black uppercase tracking-widest text-foreground">{'Q&Aログ'}</h1>
            </div>
          }
          onSearchChange={setSearch}
          onPageChange={setPage}
          onQaEditClick={onQaEditClick}
        />
      )}
    </div>
  )
}
